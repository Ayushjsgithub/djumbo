export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number; // in seconds
  genre: string;
  color: string;
  audioBuffer?: AudioBuffer;
  waveformData?: WaveformData;
  url?: string;
  isSynthesized?: boolean;
}

export interface WaveformData {
  peaks: Float32Array; // -1 to 1 normalized
  bassPeaks: Float32Array; // low frequency energy
  midPeaks: Float32Array; // mid frequency energy
  highPeaks: Float32Array; // high frequency energy
  beatPositions: number[]; // beat timestamps in seconds
  duration: number;
}

export interface HotCue {
  id: number;
  position: number; // in seconds
  color: string;
  label?: string;
}

export interface LoopState {
  active: boolean;
  start: number;
  end: number;
  lengthBeats: number;
}

export interface FXState {
  id: string;
  name: string;
  type: 'echo' | 'reverb' | 'flanger' | 'bitcrush' | 'filter' | 'roll';
  active: boolean;
  wet: number; // 0 to 1
  param1: number; // 0 to 1 (e.g. echo beats / rate)
  param2: number; // 0 to 1 (e.g. feedback / resonance)
}

export interface DeckState {
  deckId: 'A' | 'B';
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number; // 0.5 to 2.0 (1.0 = normal)
  pitchSlider: number; // -0.16 to +0.16
  pitchRange: 8 | 16 | 50; // percentage
  isKeyLocked: boolean;
  isSync: boolean;
  volume: number; // 0 to 1
  gain: number; // 0 to 2
  eqLow: number; // -24 to +6 dB (0 is flat)
  eqMid: number; // -24 to +6 dB
  eqHigh: number; // -24 to +6 dB
  killLow: boolean;
  killMid: boolean;
  killHigh: boolean;
  filter: number; // -1 (LPF) to 0 (bypass) to +1 (HPF)
  cuePosition: number;
  hotCues: (HotCue | null)[];
  loop: LoopState;
  fxList: FXState[];
  isCuePressed: boolean;
  vuLeft: number;
  vuRight: number;
  isScratching: boolean;
  scratchVelocity: number;
  selectedPadMode: 'HOT_CUE' | 'AUTO_LOOP' | 'BEAT_JUMP' | 'FX_PAD';
}

export type CrossfaderCurve = 'smooth' | 'linear' | 'scratch';

export interface SoundboardSample {
  id: string;
  name: string;
  category: string;
  color: string;
  keyShortcut: string;
  audioBuffer?: AudioBuffer;
}
