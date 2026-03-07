'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../lib/audio/AudioEngine';
import { TrackLibraryManager, PRELOADED_TRACKS } from '../lib/audio/TrackLibraryData';
import { SoundboardManager } from '../lib/audio/SoundboardAudio';
import { MidiManager } from '../lib/audio/MidiManager';
import { DeckState, Track, CrossfaderCurve } from '../lib/types/dj';
import { Header, ViewMode } from '../components/Header';
import { WaveformDisplay } from '../components/WaveformDisplay';
import { Deck } from '../components/Deck';
import { CentralMixer } from '../components/CentralMixer';
import { FXRack } from '../components/FXRack';
import { Soundboard } from '../components/Soundboard';
import { TrackLibrary } from '../components/TrackLibrary';
import { DJGuideModal } from '../components/DJGuideModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { PhraseCountdownBar } from '../components/PhraseCountdownBar';
import { NoobSimpleView } from '../components/NoobSimpleView';
import { DJAcademyView } from '../components/DJAcademyView';
import packageJson from '../../package.json';

export default function DJStudioApp() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Active View Mode (Defaults to 'simple' for beginners!)
  const [viewMode, setViewMode] = useState<ViewMode>('simple');

  // Deck States for reactive React UI updates
  const [deckAState, setDeckAState] = useState<DeckState | null>(null);
  const [deckBState, setDeckBState] = useState<DeckState | null>(null);
  const [crossfader, setCrossfader] = useState<number>(0.5);
  const [crossfaderCurve, setCrossfaderCurve] = useState<CrossfaderCurve>('smooth');
  const [masterVolume, setMasterVolume] = useState<number>(0.9);

  // Modals & UI Controls
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [isAutoMixing, setIsAutoMixing] = useState(false);

  // Layout customization toggles
  const [showWaveform, setShowWaveform] = useState(true);
  const [showPhraseBar, setShowPhraseBar] = useState(true);
  const [showFXRackA, setShowFXRackA] = useState(true);
  const [showFXRackB, setShowFXRackB] = useState(true);
  const [showSoundboard, setShowSoundboard] = useState(true);
  const [showTrackLibrary, setShowTrackLibrary] = useState(true);

  // Analysers for VU meters
  const [analyserA, setAnalyserA] = useState<AnalyserNode | undefined>();
  const [analyserB, setAnalyserB] = useState<AnalyserNode | undefined>();
  const [masterAnalyser, setMasterAnalyser] = useState<AnalyserNode | undefined>();

  // Initialize AudioEngine on mount
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;

    const ctx = engine.getAudioContext();
    setAudioCtx(ctx);

    const analysers = engine.getDeckAnalysers();
    setAnalyserA(analysers.analyserA);
    setAnalyserB(analysers.analyserB);
    setMasterAnalyser(analysers.masterAnalyser);

    setDeckAState({ ...engine.getDeckState('A') });
    setDeckBState({ ...engine.getDeckState('B') });

    // Initialize soundboard
    SoundboardManager.init(ctx);

    // Initialize Web MIDI
    MidiManager.init(engine);
    MidiManager.onDevicesChange((devices) => {
      setMidiDevices(devices);
    });

    // Auto-load starter demo tracks on both decks for instant playability
    const loadDemoTracks = async () => {
      try {
        const trackA = await TrackLibraryManager.loadTrack(ctx, PRELOADED_TRACKS[0]);
        engine.loadTrack('A', trackA);

        const trackB = await TrackLibraryManager.loadTrack(ctx, PRELOADED_TRACKS[1]);
        engine.loadTrack('B', trackB);

        setDeckAState({ ...engine.getDeckState('A') });
        setDeckBState({ ...engine.getDeckState('B') });
      } catch (err) {
        console.error('Error preloading tracks:', err);
      }
    };
    loadDemoTracks();

    // High frequency UI synchronization loop (throttled smart sync)
    const syncInterval = setInterval(() => {
      if (engineRef.current) {
        const stateA = engineRef.current.getDeckState('A');
        const stateB = engineRef.current.getDeckState('B');
        setDeckAState({ ...stateA });
        setDeckBState({ ...stateB });
      }
    }, 40); // 25 fps state sync

    return () => {
      clearInterval(syncInterval);
      if (engineRef.current) {
        engineRef.current.stop('A');
        engineRef.current.stop('B');
        try {
          const ctx = engineRef.current.getAudioContext();
          if (ctx.state !== 'closed') ctx.close();
        } catch (e) {}
      }
    };
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const engine = engineRef.current;
      if (!engine) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (deckAState?.isPlaying) engine.pause('A');
          else engine.play('A');
          break;
        case 'KeyC':
          if (!e.shiftKey) engine.pressCue('A');
          break;
        case 'KeyS':
          engine.syncDeck('A');
          break;
        case 'KeyQ':
          engine.pitchBend('A', -1);
          break;
        case 'KeyW':
          engine.pitchBend('A', 1);
          break;
        case 'KeyE':
          engine.loopHalve('A');
          break;
        case 'KeyR':
          engine.loopDouble('A');
          break;

        // Deck B controls
        case 'KeyK':
          if (deckBState?.isPlaying) engine.pause('B');
          else engine.play('B');
          break;
        case 'KeyL':
          engine.pressCue('B');
          break;
        case 'Semicolon':
          engine.syncDeck('B');
          break;
        case 'KeyO':
          engine.pitchBend('B', -1);
          break;
        case 'KeyP':
          engine.pitchBend('B', 1);
          break;
        case 'KeyU':
          engine.loopHalve('B');
          break;
        case 'KeyI':
          engine.loopDouble('B');
          break;

        // Crossfader shortcuts
        case 'KeyX':
          handleSetCrossfader(0);
          break;
        case 'KeyV':
          handleSetCrossfader(1);
          break;

        // Soundboard drops 1-7
        case 'Digit1':
          engine.playSoundboardSample('airhorn');
          break;
        case 'Digit2':
          engine.playSoundboardSample('laser');
          break;
        case 'Digit3':
          engine.playSoundboardSample('subdrop');
          break;
        case 'Digit4':
          engine.playSoundboardSample('backspin');
          break;
        case 'Digit5':
          engine.playSoundboardSample('siren');
          break;
        case 'Digit6':
          engine.playSoundboardSample('scratch');
          break;
        case 'Digit7':
          engine.playSoundboardSample('roll');
          break;

        case 'KeyF':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyC') engine.releaseCue('A');
      if (e.code === 'KeyL') engine.releaseCue('B');
      if (e.code === 'KeyQ' || e.code === 'KeyW') engine.pitchBend('A', 0);
      if (e.code === 'KeyO' || e.code === 'KeyP') engine.pitchBend('B', 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [deckAState?.isPlaying, deckBState?.isPlaying]);

  // Handler helpers wrapped in useCallback for stable child component memoization
  const handleSetCrossfader = useCallback((val: number) => {
    setCrossfader(val);
    engineRef.current?.setCrossfader(val);
  }, []);

  const handleSetCrossfaderCurve = useCallback((c: CrossfaderCurve) => {
    setCrossfaderCurve(c);
    engineRef.current?.setCrossfaderCurve(c);
  }, []);

  const handleToggleRecord = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!isRecording) {
      const started = engine.startRecording();
      if (started) setIsRecording(true);
    } else {
      const blob = engine.stopRecording();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `DJ_Mix_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    }
  }, [isRecording]);

  const handleAutoMix = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || isAutoMixing) return;
    setIsAutoMixing(true);
    try {
      await engine.triggerAutoTransition((prog) => {
        setCrossfader(engine.getCrossfaderPosition());
      });
    } finally {
      setIsAutoMixing(false);
    }
  }, [isAutoMixing]);

  // One-Touch Magic Transitions
  const handleOneTouchTransition = useCallback(async (type: 'smooth' | 'drop' | 'echoOut' | 'bassSwap') => {
    const engine = engineRef.current;
    if (!engine || !deckAState || !deckBState) return;

    const fromA = crossfader < 0.5;

    if (type === 'smooth') {
      handleAutoMix();
    } else if (type === 'drop') {
      // Instant drop snap on downbeat
      if (fromA) {
        engine.syncDeck('B');
        engine.play('B');
        handleSetCrossfader(1.0);
        setTimeout(() => engine.pause('A'), 300);
      } else {
        engine.syncDeck('A');
        engine.play('A');
        handleSetCrossfader(0.0);
        setTimeout(() => engine.pause('B'), 300);
      }
    } else if (type === 'bassSwap') {
      // Swap bass between decks
      if (fromA) {
        engine.setEQLow('A', -24);
        engine.setEQLow('B', 0);
        if (!deckBState.isPlaying) {
          engine.syncDeck('B');
          engine.play('B');
        }
      } else {
        engine.setEQLow('B', -24);
        engine.setEQLow('A', 0);
        if (!deckAState.isPlaying) {
          engine.syncDeck('A');
          engine.play('A');
        }
      }
    } else if (type === 'echoOut') {
      // Apply Echo on active deck, fade crossfader, switch to other deck
      if (fromA) {
        engine.toggleFX('A', 'echo');
        engine.syncDeck('B');
        engine.play('B');
        handleAutoMix();
      } else {
        engine.toggleFX('B', 'echo');
        engine.syncDeck('A');
        engine.play('A');
        handleAutoMix();
      }
    }
  }, [crossfader, deckAState, deckBState, handleAutoMix, handleSetCrossfader]);

  if (!deckAState || !deckBState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000] text-zinc-400 font-mono text-xs">
        INITIALIZING AUDIO ENGINE...
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#000000] text-zinc-100 flex flex-col">
      {/* Header Bar with Mode Switcher */}
      <Header
        masterVolume={masterVolume}
        onSetMasterVolume={(v) => {
          setMasterVolume(v);
          engineRef.current?.setMasterVolume(v);
        }}
        isRecording={isRecording}
        onToggleRecord={handleToggleRecord}
        midiDevices={midiDevices}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        layoutOptions={{
          showWaveform, setShowWaveform,
          showPhraseBar, setShowPhraseBar,
          showFXRackA, setShowFXRackA,
          showFXRackB, setShowFXRackB,
          showSoundboard, setShowSoundboard,
          showTrackLibrary, setShowTrackLibrary
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-3 sm:p-4 gap-3 max-w-[1600px] w-full mx-auto">
        {/* Top Master Waveform Display */}
        {showWaveform && (
          <WaveformDisplay
            deckA={deckAState}
            deckB={deckBState}
            onSeekA={(t) => engineRef.current?.seek('A', t)}
            onSeekB={(t) => engineRef.current?.seek('B', t)}
            onClose={() => setShowWaveform(false)}
          />
        )}

        {/* Real-time Phrase Countdown & One-Touch Drop Predictor Bar */}
        {showPhraseBar && (
          <PhraseCountdownBar
            deckA={deckAState}
            deckB={deckBState}
            onOneTouchTransition={handleOneTouchTransition}
            isTransitioning={isAutoMixing}
            onClose={() => setShowPhraseBar(false)}
          />
        )}

        {/* 1. SIMPLE NOOB DJ VIEW */}
        {viewMode === 'simple' && (
          <NoobSimpleView
            deckA={deckAState}
            deckB={deckBState}
            crossfader={crossfader}
            onPlayA={() => engineRef.current?.play('A')}
            onPauseA={() => engineRef.current?.pause('A')}
            onPlayB={() => engineRef.current?.play('B')}
            onPauseB={() => engineRef.current?.pause('B')}
            onSyncA={() => engineRef.current?.syncDeck('A')}
            onSyncB={() => engineRef.current?.syncDeck('B')}
            onSeekA={(t) => engineRef.current?.seek('A', t)}
            onSeekB={(t) => engineRef.current?.seek('B', t)}
            onSetEQLowA={(v) => engineRef.current?.setEQLow('A', v)}
            onSetEQLowB={(v) => engineRef.current?.setEQLow('B', v)}
            onSetFilterA={(v) => engineRef.current?.setFilter('A', v)}
            onSetFilterB={(v) => engineRef.current?.setFilter('B', v)}
            onSetCrossfader={handleSetCrossfader}
            onAutoMix={handleAutoMix}
            isAutoMixing={isAutoMixing}
            onTriggerSample={(id) => engineRef.current?.playSoundboardSample(id)}
            onOpenLibrary={() => {
            }}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* 2. INTERACTIVE DJ ACADEMY VIEW */}
        {viewMode === 'academy' && (
          <DJAcademyView
            deckA={deckAState}
            deckB={deckBState}
            onPlayA={() => engineRef.current?.play('A')}
            onPlayB={() => engineRef.current?.play('B')}
            onSyncB={() => engineRef.current?.syncDeck('B')}
            onSeekA={(t) => engineRef.current?.seek('A', t)}
            onSeekB={(t) => engineRef.current?.seek('B', t)}
            onSetEQLowA={(v) => engineRef.current?.setEQLow('A', v)}
            onSetEQLowB={(v) => engineRef.current?.setEQLow('B', v)}
            onAutoMix={handleAutoMix}
          />
        )}
        {viewMode === 'pro' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start animate-in fade-in duration-150">
            <div className="lg:col-span-4 flex flex-col gap-3">
              <Deck
                deckId="A"
                state={deckAState}
                onPlay={() => engineRef.current?.play('A')}
                onPause={() => engineRef.current?.pause('A')}
                onPressCue={() => engineRef.current?.pressCue('A')}
                onReleaseCue={() => engineRef.current?.releaseCue('A')}
                onSync={() => engineRef.current?.syncDeck('A')}
                onPitchChange={(v) => engineRef.current?.setPitchSlider('A', v)}
                onPitchBend={(d) => engineRef.current?.pitchBend('A', d)}
                onScratchStart={() => engineRef.current?.startScratch('A')}
                onScratchMove={(d) => engineRef.current?.scratchMove('A', d)}
                onScratchEnd={() => engineRef.current?.endScratch('A')}
                onTriggerHotCue={(idx, shift) => engineRef.current?.triggerHotCue('A', idx, shift)}
                onToggleLoop={(beats) => engineRef.current?.toggleAutoLoop('A', beats)}
                onLoopHalve={() => engineRef.current?.loopHalve('A')}
                onLoopDouble={() => engineRef.current?.loopDouble('A')}
                onBeatJump={(beats) => {
                  if (deckAState.track) {
                    const sec = (60 / (deckAState.track.bpm * deckAState.playbackRate)) * beats;
                    engineRef.current?.seek('A', deckAState.currentTime + sec);
                  }
                }}
                onStartRoll={(beats) => engineRef.current?.toggleAutoLoop('A', beats)}
                onEndRoll={() => {
                  if (deckAState.loop.active) engineRef.current?.toggleAutoLoop('A', deckAState.loop.lengthBeats);
                }}
                onOpenLibrary={() => {
                }}
              />
              {showFXRackA && (
                <FXRack
                  deckId="A"
                  fxList={deckAState.fxList}
                  onToggleFX={(id) => engineRef.current?.toggleFX('A', id)}
                  onSetFXParam={(id, w, p1, p2) => engineRef.current?.setFXParam('A', id, w, p1, p2)}
                  onFilterSweep={(f) => engineRef.current?.setFilter('A', f)}
                  onClose={() => setShowFXRackA(false)}
                />
              )}
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <CentralMixer
                deckA={deckAState}
                deckB={deckBState}
                crossfader={crossfader}
                curve={crossfaderCurve}
                analyserA={analyserA}
                analyserB={analyserB}
                masterAnalyser={masterAnalyser}
                onSetGainA={(v) => engineRef.current?.setGainTrim('A', v)}
                onSetGainB={(v) => engineRef.current?.setGainTrim('B', v)}
                onSetEQLowA={(v) => engineRef.current?.setEQLow('A', v)}
                onSetEQMidA={(v) => engineRef.current?.setEQMid('A', v)}
                onSetEQHighA={(v) => engineRef.current?.setEQHigh('A', v)}
                onToggleKillA={(b) => engineRef.current?.toggleKill('A', b)}
                onSetFilterA={(v) => engineRef.current?.setFilter('A', v)}
                onSetVolumeA={(v) => engineRef.current?.setVolume('A', v)}
                onSetEQLowB={(v) => engineRef.current?.setEQLow('B', v)}
                onSetEQMidB={(v) => engineRef.current?.setEQMid('B', v)}
                onSetEQHighB={(v) => engineRef.current?.setEQHigh('B', v)}
                onToggleKillB={(b) => engineRef.current?.toggleKill('B', b)}
                onSetFilterB={(v) => engineRef.current?.setFilter('B', v)}
                onSetVolumeB={(v) => engineRef.current?.setVolume('B', v)}
                onSetCrossfader={handleSetCrossfader}
                onSetCurve={handleSetCrossfaderCurve}
                onAutoMix={handleAutoMix}
                isAutoMixing={isAutoMixing}
              />
              {showSoundboard && (
                <Soundboard
                  onTriggerSample={(sampleId) => engineRef.current?.playSoundboardSample(sampleId)}
                  onClose={() => setShowSoundboard(false)}
                />
              )}
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <Deck
                deckId="B"
                state={deckBState}
                onPlay={() => engineRef.current?.play('B')}
                onPause={() => engineRef.current?.pause('B')}
                onPressCue={() => engineRef.current?.pressCue('B')}
                onReleaseCue={() => engineRef.current?.releaseCue('B')}
                onSync={() => engineRef.current?.syncDeck('B')}
                onPitchChange={(v) => engineRef.current?.setPitchSlider('B', v)}
                onPitchBend={(d) => engineRef.current?.pitchBend('B', d)}
                onScratchStart={() => engineRef.current?.startScratch('B')}
                onScratchMove={(d) => engineRef.current?.scratchMove('B', d)}
                onScratchEnd={() => engineRef.current?.endScratch('B')}
                onTriggerHotCue={(idx, shift) => engineRef.current?.triggerHotCue('B', idx, shift)}
                onToggleLoop={(beats) => engineRef.current?.toggleAutoLoop('B', beats)}
                onLoopHalve={() => engineRef.current?.loopHalve('B')}
                onLoopDouble={() => engineRef.current?.loopDouble('B')}
                onBeatJump={(beats) => {
                  if (deckBState.track) {
                    const sec = (60 / (deckBState.track.bpm * deckBState.playbackRate)) * beats;
                    engineRef.current?.seek('B', deckBState.currentTime + sec);
                  }
                }}
                onStartRoll={(beats) => engineRef.current?.toggleAutoLoop('B', beats)}
                onEndRoll={() => {
                  if (deckBState.loop.active) engineRef.current?.toggleAutoLoop('B', deckBState.loop.lengthBeats);
                }}
                onOpenLibrary={() => {
                }}
              />
              {showFXRackB && (
                <FXRack
                  deckId="B"
                  fxList={deckBState.fxList}
                  onToggleFX={(id) => engineRef.current?.toggleFX('B', id)}
                  onSetFXParam={(id, w, p1, p2) => engineRef.current?.setFXParam('B', id, w, p1, p2)}
                  onFilterSweep={(f) => engineRef.current?.setFilter('B', f)}
                  onClose={() => setShowFXRackB(false)}
                />
              )}
            </div>
          </div>
        )}

        {/* Track Library Crate */}
        {showTrackLibrary && (
          <div id="track-library-section">
            <TrackLibrary
              audioCtx={audioCtx}
              onLoadDeckA={(track) => {
                engineRef.current?.loadTrack('A', track);
                setDeckAState({ ...engineRef.current!.getDeckState('A') });
              }}
              onLoadDeckB={(track) => {
                engineRef.current?.loadTrack('B', track);
                setDeckBState({ ...engineRef.current!.getDeckState('B') });
              }}
              onClose={() => setShowTrackLibrary(false)}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center text-xs text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Djumbo v{packageJson.version}</span>
          <span className="hidden sm:inline">•</span>
          <a 
            href="https://github.com/Ayushjsgithub/djumbo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition-colors underline decoration-zinc-700 underline-offset-2"
          >
            GitHub
          </a>
        </footer>
      </div>

      {/* Modals */}
      <DJGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </main>
  );
}
