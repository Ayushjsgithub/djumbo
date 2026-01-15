import { DeckState, FXState, Track, CrossfaderCurve } from '../types/dj';
import { SoundboardManager } from './SoundboardAudio';

export interface DeckNodes {
  source: AudioBufferSourceNode | null;
  gainTrim: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  filterLPF: BiquadFilterNode;
  filterHPF: BiquadFilterNode;
  fxSend: GainNode;
  fxReturn: GainNode;
  // FX Nodes
  delayNode: DelayNode;
  delayFeedback: GainNode;
  delayWet: GainNode;
  reverbWet: GainNode;
  flangerDelay: DelayNode;
  flangerWet: GainNode;
  channelFader: GainNode;
  crossfadeGain: GainNode;
  analyser: AnalyserNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private masterLimiter!: DynamicsCompressorNode;
  private masterAnalyser!: AnalyserNode;
  private soundboardGain!: GainNode;

  private deckANodes!: DeckNodes;
  private deckBNodes!: DeckNodes;

  private deckAState: DeckState;
  private deckBState: DeckState;
  private crossfaderPosition: number = 0.5; // 0 (Deck A) to 1 (Deck B)
  private crossfaderCurve: CrossfaderCurve = 'smooth';

  // Playback tracking
  private playStartTimeA: number = 0;
  private playOffsetA: number = 0;
  private playStartTimeB: number = 0;
  private playOffsetB: number = 0;

  // Recording
  private recDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private recordStartTime: number = 0;

  constructor() {
    this.deckAState = this.createDefaultDeckState('A');
    this.deckBState = this.createDefaultDeckState('B');
  }

  private createDefaultDeckState(deckId: 'A' | 'B'): DeckState {
    const defaultFX: FXState[] = [
      { id: 'echo', name: 'ECHO', type: 'echo', active: false, wet: 0.5, param1: 0.5, param2: 0.4 },
      { id: 'reverb', name: 'REVERB', type: 'reverb', active: false, wet: 0.4, param1: 0.6, param2: 0.5 },
      { id: 'flanger', name: 'FLANGER', type: 'flanger', active: false, wet: 0.5, param1: 0.3, param2: 0.7 },
      { id: 'bitcrush', name: 'BITCRUSH', type: 'bitcrush', active: false, wet: 0.6, param1: 0.5, param2: 0.8 },
    ];

    return {
      deckId,
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      pitchSlider: 0,
      pitchRange: 16,
      isKeyLocked: true,
      isSync: false,
      volume: 0.85,
      gain: 1.0,
      eqLow: 0,
      eqMid: 0,
      eqHigh: 0,
      killLow: false,
      killMid: false,
      killHigh: false,
      filter: 0,
      cuePosition: 0,
      hotCues: Array(8).fill(null),
      loop: { active: false, start: 0, end: 0, lengthBeats: 4 },
      fxList: defaultFX,
      isCuePressed: false,
      vuLeft: 0,
      vuRight: 0,
      isScratching: false,
      scratchVelocity: 0,
      selectedPadMode: 'HOT_CUE',
    };
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.initMasterGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private initMasterGraph() {
    if (!this.ctx) return;

    // Master Limiter / Compressor (prevents any harsh digital clipping)
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    // Master Analyser
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;

    // Soundboard bus
    this.soundboardGain = this.ctx.createGain();
    this.soundboardGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.soundboardGain.connect(this.masterLimiter);

    // Routing
    this.masterLimiter.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Build Deck A & Deck B node graphs
    this.deckANodes = this.buildDeckGraph('A');
    this.deckBNodes = this.buildDeckGraph('B');

    // Update crossfader initial gains
    this.updateCrossfaderGains();
  }

  private buildDeckGraph(deckId: 'A' | 'B'): DeckNodes {
    if (!this.ctx) throw new Error('AudioContext not ready');

    const gainTrim = this.ctx.createGain();
    gainTrim.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // 3-Band Isolator EQ (Pro DJ curve)
    const eqLow = this.ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.setValueAtTime(250, this.ctx.currentTime);
    eqLow.gain.setValueAtTime(0, this.ctx.currentTime);

    const eqMid = this.ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.setValueAtTime(1200, this.ctx.currentTime);
    eqMid.Q.setValueAtTime(0.9, this.ctx.currentTime);
    eqMid.gain.setValueAtTime(0, this.ctx.currentTime);

    const eqHigh = this.ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.setValueAtTime(3800, this.ctx.currentTime);
    eqHigh.gain.setValueAtTime(0, this.ctx.currentTime);

    // Dual Filter (LPF + HPF in series)
    const filterLPF = this.ctx.createBiquadFilter();
    filterLPF.type = 'lowpass';
    filterLPF.frequency.setValueAtTime(20000, this.ctx.currentTime);
    filterLPF.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const filterHPF = this.ctx.createBiquadFilter();
    filterHPF.type = 'highpass';
    filterHPF.frequency.setValueAtTime(20, this.ctx.currentTime);
    filterHPF.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // FX Inserts (Echo & Reverb)
    const fxSend = this.ctx.createGain();
    const fxReturn = this.ctx.createGain();

    const delayNode = this.ctx.createDelay();
    delayNode.delayTime.setValueAtTime(0.35, this.ctx.currentTime);
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);
    const delayWet = this.ctx.createGain();
    delayWet.gain.setValueAtTime(0.0, this.ctx.currentTime);

    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWet);

    const reverbWet = this.ctx.createGain();
    reverbWet.gain.setValueAtTime(0.0, this.ctx.currentTime);

    const flangerDelay = this.ctx.createDelay();
    flangerDelay.delayTime.setValueAtTime(0.005, this.ctx.currentTime);
    const flangerWet = this.ctx.createGain();
    flangerWet.gain.setValueAtTime(0.0, this.ctx.currentTime);
    flangerDelay.connect(flangerWet);

    // Channel Fader
    const channelFader = this.ctx.createGain();
    channelFader.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Crossfader Node
    const crossfadeGain = this.ctx.createGain();

    // Deck Analyser for Deck VU & Waveforms
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 128;

    // Connect Chain:
    // Source -> GainTrim -> EQLow -> EQMid -> EQHigh -> FilterLPF -> FilterHPF -> fxSend -> ChannelFader -> CrossfadeGain -> MasterLimiter
    gainTrim.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(filterLPF);
    filterLPF.connect(filterHPF);
    filterHPF.connect(fxSend);

    // Direct Dry path
    fxSend.connect(channelFader);

    // Wet FX paths
    fxSend.connect(delayNode);
    delayWet.connect(channelFader);

    fxSend.connect(flangerDelay);
    flangerWet.connect(channelFader);

    channelFader.connect(crossfadeGain);
    channelFader.connect(analyser);

    crossfadeGain.connect(this.masterLimiter);

    return {
      source: null,
      gainTrim,
      eqLow,
      eqMid,
      eqHigh,
      filterLPF,
      filterHPF,
      fxSend,
      fxReturn,
      delayNode,
      delayFeedback,
      delayWet,
      reverbWet,
      flangerDelay,
      flangerWet,
      channelFader,
      crossfadeGain,
      analyser,
    };
  }

  // --- PLAYBACK CONTROL ---

  public loadTrack(deckId: 'A' | 'B', track: Track) {
    this.getAudioContext();
    this.stop(deckId);

    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    state.track = track;
    state.currentTime = 0;
    state.duration = track.duration;
    state.cuePosition = 0;
    state.hotCues = Array(8).fill(null);
    state.loop = { active: false, start: 0, end: 0, lengthBeats: 4 };

    if (deckId === 'A') this.playOffsetA = 0;
    else this.playOffsetB = 0;
  }

  public play(deckId: 'A' | 'B') {
    const ctx = this.getAudioContext();
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;

    if (!state.track || !state.track.audioBuffer || state.isPlaying) return;

    // Disconnect old source if any
    if (nodes.source) {
      try { nodes.source.stop(); } catch (e) {}
      nodes.source.disconnect();
    }

    const source = ctx.createBufferSource();
    source.buffer = state.track.audioBuffer;
    source.playbackRate.setValueAtTime(state.playbackRate, ctx.currentTime);

    source.connect(nodes.gainTrim);
    nodes.source = source;

    const offset = deckId === 'A' ? this.playOffsetA : this.playOffsetB;
    const safeOffset = Math.max(0, Math.min(offset, state.track.duration - 0.05));

    source.start(0, safeOffset);
    state.isPlaying = true;

    if (deckId === 'A') {
      this.playStartTimeA = ctx.currentTime;
      this.playOffsetA = safeOffset;
    } else {
      this.playStartTimeB = ctx.currentTime;
      this.playOffsetB = safeOffset;
    }

    source.onended = () => {
      if (state.isPlaying && !state.loop.active) {
        state.isPlaying = false;
      }
    };
  }

  public pause(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;

    if (!state.isPlaying) return;

    this.updateCurrentTime(deckId);

    if (nodes.source) {
      try { nodes.source.stop(); } catch (e) {}
      nodes.source.disconnect();
      nodes.source = null;
    }

    state.isPlaying = false;
  }

  public stop(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    this.pause(deckId);
    state.currentTime = 0;
    if (deckId === 'A') this.playOffsetA = 0;
    else this.playOffsetB = 0;
  }

  public seek(deckId: 'A' | 'B', timeSeconds: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (!state.track) return;

    const clampedTime = Math.max(0, Math.min(timeSeconds, state.track.duration));
    const wasPlaying = state.isPlaying;

    if (wasPlaying) this.pause(deckId);

    if (deckId === 'A') this.playOffsetA = clampedTime;
    else this.playOffsetB = clampedTime;
    state.currentTime = clampedTime;

    if (wasPlaying) this.play(deckId);
  }

  // --- CUE & HOT CUES ---

  public pressCue(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (!state.track) return;

    if (state.isPlaying) {
      // Return to cue position and pause
      this.pause(deckId);
      this.seek(deckId, state.cuePosition);
    } else {
      // Set new cue point at current position and momentarily play
      state.cuePosition = state.currentTime;
      state.isCuePressed = true;
      this.play(deckId);
    }
  }

  public releaseCue(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (state.isCuePressed) {
      state.isCuePressed = false;
      this.pause(deckId);
      this.seek(deckId, state.cuePosition);
    }
  }

  public triggerHotCue(deckId: 'A' | 'B', index: number, isShiftPressed: boolean = false) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (!state.track) return;

    const cueColors = ['#00f2ff', '#ff7700', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#ef4444'];

    if (isShiftPressed) {
      // Delete Hot Cue
      state.hotCues[index] = null;
    } else {
      if (state.hotCues[index]) {
        // Jump to Hot Cue
        this.seek(deckId, state.hotCues[index]!.position);
        if (!state.isPlaying) this.play(deckId);
      } else {
        // Set new Hot Cue
        state.hotCues[index] = {
          id: index,
          position: state.currentTime,
          color: cueColors[index % cueColors.length],
          label: `CUE ${index + 1}`,
        };
      }
    }
  }

  // --- JOG WHEEL SCRATCHING & PITCH BEND ---

  public startScratch(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    state.isScratching = true;
    state.scratchVelocity = 0;
  }

  public scratchMove(deckId: 'A' | 'B', deltaRot: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    if (!state.track || !this.ctx) return;

    // deltaRot corresponds to turntable angular displacement
    state.scratchVelocity = deltaRot;
    const seekDelta = deltaRot * 0.45; // sensitivity
    const targetTime = Math.max(0, Math.min(state.track.duration, state.currentTime + seekDelta));

    state.currentTime = targetTime;
    if (deckId === 'A') this.playOffsetA = targetTime;
    else this.playOffsetB = targetTime;

    // If source is active, modulate playback rate dynamically for vinyl scratch sound
    if (nodes.source) {
      const scratchRate = Math.max(0.1, Math.min(3.0, 1.0 + deltaRot * 4));
      nodes.source.playbackRate.setValueAtTime(scratchRate, this.ctx.currentTime);
    }
  }

  public endScratch(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.isScratching = false;

    if (nodes.source && this.ctx) {
      nodes.source.playbackRate.setValueAtTime(state.playbackRate, this.ctx.currentTime);
    }

    if (state.isPlaying) {
      this.play(deckId); // re-sync source buffer at new offset
    }
  }

  public pitchBend(deckId: 'A' | 'B', direction: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    if (!nodes.source || !this.ctx) return;

    // direction: +1 (nudge faster +4%), -1 (nudge slower -4%), 0 (release)
    const nudgeFactor = 1.0 + direction * 0.05;
    const targetRate = state.playbackRate * nudgeFactor;
    nodes.source.playbackRate.setTargetAtTime(targetRate, this.ctx.currentTime, 0.05);
  }

  // --- TEMPO & BEAT SYNC ---

  public setPitchSlider(deckId: 'A' | 'B', value: number) {
    // value: -1 to +1
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    state.pitchSlider = value;
    state.isSync = false; // Manual pitch change breaks sync

    const rangePercent = state.pitchRange / 100;
    state.playbackRate = 1.0 + (value * rangePercent);

    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    if (nodes.source && this.ctx) {
      nodes.source.playbackRate.setValueAtTime(state.playbackRate, this.ctx.currentTime);
    }
  }

  public syncDeck(deckId: 'A' | 'B') {
    const targetDeck = deckId === 'A' ? this.deckBState : this.deckAState;
    const sourceDeck = deckId === 'A' ? this.deckAState : this.deckBState;

    // Toggle off if already syncing
    if (sourceDeck.isSync) {
      sourceDeck.isSync = false;
      return;
    }

    if (!targetDeck.track || !sourceDeck.track) return;

    // 1. Match BPM
    const targetBPM = targetDeck.track.bpm * targetDeck.playbackRate;
    const newRate = targetBPM / sourceDeck.track.bpm;
    sourceDeck.playbackRate = newRate;

    const rangePercent = sourceDeck.pitchRange / 100;
    sourceDeck.pitchSlider = Math.max(-1, Math.min(1, (newRate - 1.0) / rangePercent));

    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    if (nodes.source && this.ctx) {
      nodes.source.playbackRate.setValueAtTime(newRate, this.ctx.currentTime);
    }

    // 2. Align Phase (snap downbeat to target beat)
    if (targetDeck.isPlaying && sourceDeck.isPlaying) {
      const beatInterval = 60 / targetBPM;
      const targetPhase = targetDeck.currentTime % beatInterval;
      const currentPhase = sourceDeck.currentTime % beatInterval;
      const phaseDiff = targetPhase - currentPhase;
      this.seek(deckId, sourceDeck.currentTime + phaseDiff);
    }

    sourceDeck.isSync = true;
  }

  // --- EQ & FILTER ---

  public setEQLow(deckId: 'A' | 'B', gainDb: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.eqLow = gainDb;
    if (this.ctx) {
      const val = state.killLow ? -70 : gainDb;
      nodes.eqLow.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setEQMid(deckId: 'A' | 'B', gainDb: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.eqMid = gainDb;
    if (this.ctx) {
      const val = state.killMid ? -70 : gainDb;
      nodes.eqMid.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setEQHigh(deckId: 'A' | 'B', gainDb: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.eqHigh = gainDb;
    if (this.ctx) {
      const val = state.killHigh ? -70 : gainDb;
      nodes.eqHigh.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public toggleKill(deckId: 'A' | 'B', band: 'low' | 'mid' | 'high') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (band === 'low') {
      state.killLow = !state.killLow;
      this.setEQLow(deckId, state.eqLow);
    } else if (band === 'mid') {
      state.killMid = !state.killMid;
      this.setEQMid(deckId, state.eqMid);
    } else {
      state.killHigh = !state.killHigh;
      this.setEQHigh(deckId, state.eqHigh);
    }
  }

  public setFilter(deckId: 'A' | 'B', value: number) {
    // -1 (Lowpass) to 0 (Bypass) to +1 (Highpass)
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.filter = value;

    if (!this.ctx) return;

    if (value < 0) {
      // Low Pass active: sweep 20000Hz down to 80Hz
      const freq = 20000 * Math.pow(10, value * 2.4);
      nodes.filterLPF.frequency.setTargetAtTime(Math.max(80, freq), this.ctx.currentTime, 0.02);
      nodes.filterHPF.frequency.setTargetAtTime(20, this.ctx.currentTime, 0.02);
    } else if (value > 0) {
      // High Pass active: sweep 20Hz up to 10000Hz
      const freq = 20 * Math.pow(10, value * 2.7);
      nodes.filterHPF.frequency.setTargetAtTime(Math.min(12000, freq), this.ctx.currentTime, 0.02);
      nodes.filterLPF.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.02);
    } else {
      // Bypass
      nodes.filterLPF.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.02);
      nodes.filterHPF.frequency.setTargetAtTime(20, this.ctx.currentTime, 0.02);
    }
  }

  public setGainTrim(deckId: 'A' | 'B', value: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.gain = value;
    if (this.ctx) {
      nodes.gainTrim.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  public setVolume(deckId: 'A' | 'B', value: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    state.volume = value;
    if (this.ctx) {
      nodes.channelFader.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  // --- CROSSFADER & MASTER ---

  public setCrossfader(position: number) {
    // 0 = Full Deck A, 0.5 = Center, 1 = Full Deck B
    this.crossfaderPosition = Math.max(0, Math.min(1, position));
    this.updateCrossfaderGains();
  }

  public setCrossfaderCurve(curve: CrossfaderCurve) {
    this.crossfaderCurve = curve;
    this.updateCrossfaderGains();
  }

  private updateCrossfaderGains() {
    if (!this.ctx || !this.deckANodes || !this.deckBNodes) return;

    const pos = this.crossfaderPosition;
    let gainA = 1;
    let gainB = 1;

    if (this.crossfaderCurve === 'smooth') {
      // Equal power constant loudness curve
      gainA = Math.cos(pos * 0.5 * Math.PI);
      gainB = Math.sin(pos * 0.5 * Math.PI);
    } else if (this.crossfaderCurve === 'linear') {
      // Linear blend
      gainA = 1 - pos;
      gainB = pos;
    } else if (this.crossfaderCurve === 'scratch') {
      // Fast cut curve for DJ scratch / beat juggling
      gainA = pos > 0.85 ? Math.max(0, (1 - pos) / 0.15) : 1;
      gainB = pos < 0.15 ? Math.max(0, pos / 0.15) : 1;
    }

    this.deckANodes.crossfadeGain.gain.setTargetAtTime(gainA, this.ctx.currentTime, 0.015);
    this.deckBNodes.crossfadeGain.gain.setTargetAtTime(gainB, this.ctx.currentTime, 0.015);
  }

  public setMasterVolume(value: number) {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  // --- LOOPS ---

  public toggleAutoLoop(deckId: 'A' | 'B', lengthBeats: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (!state.track) return;

    if (state.loop.active && state.loop.lengthBeats === lengthBeats) {
      // Exit loop
      state.loop.active = false;
    } else {
      // Set new loop at current position
      const effectiveBPM = state.track.bpm * state.playbackRate;
      const beatDuration = 60 / effectiveBPM;
      const loopDuration = lengthBeats * beatDuration;

      state.loop = {
        active: true,
        start: state.currentTime,
        end: state.currentTime + loopDuration,
        lengthBeats,
      };
    }
  }

  public loopHalve(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (state.loop.active) {
      const newLen = state.loop.lengthBeats / 2;
      this.toggleAutoLoop(deckId, Math.max(0.0625, newLen));
    }
  }

  public loopDouble(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (state.loop.active) {
      const newLen = state.loop.lengthBeats * 2;
      this.toggleAutoLoop(deckId, Math.min(32, newLen));
    }
  }

  // --- FX CONTROLS ---

  public toggleFX(deckId: 'A' | 'B', fxId: string) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    const fx = state.fxList.find(f => f.id === fxId);
    if (!fx || !this.ctx) return;

    fx.active = !fx.active;
    const wetVal = fx.active ? fx.wet : 0.0;

    if (fx.type === 'echo') {
      nodes.delayWet.gain.setTargetAtTime(wetVal, this.ctx.currentTime, 0.03);
    } else if (fx.type === 'flanger') {
      nodes.flangerWet.gain.setTargetAtTime(wetVal, this.ctx.currentTime, 0.03);
    }
  }

  public setFXParam(deckId: 'A' | 'B', fxId: string, wet: number, param1?: number, param2?: number) {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    const nodes = deckId === 'A' ? this.deckANodes : this.deckBNodes;
    const fx = state.fxList.find(f => f.id === fxId);
    if (!fx || !this.ctx) return;

    fx.wet = wet;
    if (param1 !== undefined) fx.param1 = param1;
    if (param2 !== undefined) fx.param2 = param2;

    if (fx.active) {
      if (fx.type === 'echo') {
        nodes.delayWet.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.03);
        nodes.delayNode.delayTime.setTargetAtTime(0.1 + fx.param1 * 0.6, this.ctx.currentTime, 0.03);
        nodes.delayFeedback.gain.setTargetAtTime(fx.param2 * 0.8, this.ctx.currentTime, 0.03);
      }
    }
  }

  // --- SOUNDBOARD TRIGGER ---

  public playSoundboardSample(sampleId: string) {
    const ctx = this.getAudioContext();
    SoundboardManager.play(ctx, this.soundboardGain, sampleId);
  }

  // --- SMART AUTO-MIX / TRANSITION ---

  public triggerAutoTransition(onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      // Determine which deck is active (e.g. if Deck A is loud, transition to Deck B)
      const fromA = this.crossfaderPosition < 0.5;
      const targetPos = fromA ? 1.0 : 0.0;
      const startPos = this.crossfaderPosition;
      const steps = 60;
      let currentStep = 0;

      // Start target deck if paused
      if (fromA && !this.deckBState.isPlaying) {
        this.syncDeck('B');
        this.play('B');
      } else if (!fromA && !this.deckAState.isPlaying) {
        this.syncDeck('A');
        this.play('A');
      }

      const interval = setInterval(() => {
        currentStep++;
        const prog = currentStep / steps;
        const smoothProg = 0.5 - 0.5 * Math.cos(prog * Math.PI); // S-curve

        // Crossfade
        this.setCrossfader(startPos + (targetPos - startPos) * smoothProg);

        // Smart EQ Bass-swap on midpoint
        if (fromA) {
          if (prog > 0.4) {
            this.setEQLow('A', -24 * ((prog - 0.4) / 0.6));
          }
        } else {
          if (prog > 0.4) {
            this.setEQLow('B', -24 * ((prog - 0.4) / 0.6));
          }
        }

        if (onProgress) onProgress(prog);

        if (currentStep >= steps) {
          clearInterval(interval);
          // Pause outgoing deck and reset its bass so it sounds normal next time
          if (fromA) {
            this.pause('A');
            this.setEQLow('A', 0);
          } else {
            this.pause('B');
            this.setEQLow('B', 0);
          }
          resolve();
        }
      }, 60);
    });
  }

  // --- LIVE RECORDING ---

  public startRecording(): boolean {
    if (this.isRecording || !this.ctx) return false;

    try {
      this.recDest = this.ctx.createMediaStreamDestination();
      this.masterAnalyser.connect(this.recDest);

      this.recordedChunks = [];
      const options = { mimeType: 'audio/webm;codecs=opus' };
      this.mediaRecorder = new MediaRecorder(this.recDest.stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordStartTime = Date.now();
      return true;
    } catch (e) {
      console.error('Recording error:', e);
      return false;
    }
  }

  public stopRecording(): Blob | null {
    if (!this.isRecording || !this.mediaRecorder) return null;

    this.mediaRecorder.stop();
    this.isRecording = false;

    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    return blob;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  // --- REALTIME TIME TRACKING & METER UPDATE ---

  public updateCurrentTime(deckId: 'A' | 'B') {
    const state = deckId === 'A' ? this.deckAState : this.deckBState;
    if (!state.isPlaying || !this.ctx || state.isScratching) return;

    const startTime = deckId === 'A' ? this.playStartTimeA : this.playStartTimeB;
    const startOffset = deckId === 'A' ? this.playOffsetA : this.playOffsetB;
    const elapsed = (this.ctx.currentTime - startTime) * state.playbackRate;
    let newTime = startOffset + elapsed;

    // Check Loop Bounds
    if (state.loop.active && state.loop.end > state.loop.start) {
      if (newTime >= state.loop.end) {
        newTime = state.loop.start + (newTime - state.loop.end) % (state.loop.end - state.loop.start);
        this.seek(deckId, newTime);
        return;
      }
    }

    if (state.track && newTime >= state.track.duration) {
      newTime = state.track.duration;
      state.isPlaying = false;
    }

    state.currentTime = newTime;
  }

  public getDeckAnalysers() {
    return {
      analyserA: this.deckANodes?.analyser,
      analyserB: this.deckBNodes?.analyser,
      masterAnalyser: this.masterAnalyser,
    };
  }

  public getDeckState(deckId: 'A' | 'B'): DeckState {
    this.updateCurrentTime(deckId);
    return deckId === 'A' ? this.deckAState : this.deckBState;
  }

  public getCrossfaderPosition(): number {
    return this.crossfaderPosition;
  }

  public getCrossfaderCurve(): CrossfaderCurve {
    return this.crossfaderCurve;
  }
}
