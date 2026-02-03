'use client';

import React, { memo } from 'react';
import { DeckState, Track } from '../lib/types/dj';
import { VinylJogWheel } from './VinylJogWheel';
import { PerformancePads } from './PerformancePads';
import { Play, Pause, Zap, Music, Lock } from 'lucide-react';

interface DeckProps {
  deckId: 'A' | 'B';
  state: DeckState;
  color?: string;
  onPlay: () => void;
  onPause: () => void;
  onPressCue: () => void;
  onReleaseCue: () => void;
  onSync: () => void;
  onPitchChange: (value: number) => void;
  onPitchBend: (direction: number) => void;
  onScratchStart: () => void;
  onScratchMove: (deltaRot: number) => void;
  onScratchEnd: () => void;
  onTriggerHotCue: (index: number, isShift: boolean) => void;
  onToggleLoop: (beats: number) => void;
  onLoopHalve: () => void;
  onLoopDouble: () => void;
  onBeatJump: (beats: number) => void;
  onStartRoll: (beats: number) => void;
  onEndRoll: () => void;
  onOpenLibrary: () => void;
}

const DeckComponent: React.FC<DeckProps> = ({
  deckId,
  state,
  onPlay,
  onPause,
  onPressCue,
  onReleaseCue,
  onSync,
  onPitchChange,
  onPitchBend,
  onScratchStart,
  onScratchMove,
  onScratchEnd,
  onTriggerHotCue,
  onToggleLoop,
  onLoopHalve,
  onLoopDouble,
  onBeatJump,
  onStartRoll,
  onEndRoll,
  onOpenLibrary,
}) => {
  const effectiveBPM = state.track ? (state.track.bpm * state.playbackRate).toFixed(2) : '128.00';
  const originalBPM = state.track ? state.track.bpm.toFixed(1) : '128.0';
  const pitchPercent = ((state.playbackRate - 1.0) * 100).toFixed(1);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const elapsed = formatTime(state.currentTime);
  const remaining = formatTime(Math.max(0, state.duration - state.currentTime));

  return (
    <div className="flex flex-col flex-1 bg-[#000000] border border-[#2a2a2a] rounded-3xl p-3 sm:p-4 relative">
      {/* Track Info Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#18181b] gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-3xl bg-[#18181b] border border-zinc-700 flex items-center justify-center font-black font-mono text-xs text-white flex-shrink-0">
            {deckId}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {state.track ? state.track.title : 'No Track Loaded'}
              </span>
              {state.track && (
                <span className="px-1.5 py-0.2 rounded-3xl text-[8px] font-mono font-bold bg-[#141416] text-zinc-400 border border-zinc-800">
                  {state.track.genre}
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400 truncate">
              {state.track ? state.track.artist : 'Click "Library" to load a track'}
            </span>
          </div>
        </div>

        {/* Quick Load Button */}
        <button
          onClick={onOpenLibrary}
          className="px-2.5 py-1 rounded-3xl bg-[#0d0d0d] hover:bg-[#18181b] text-xs font-mono font-bold text-zinc-300 hover:text-white border border-zinc-800 flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all duration-100"
        >
          <Music className="w-3 h-3 text-zinc-400" />
          LIBRARY
        </button>
      </div>

      {/* BPM, Key & Pitch Display Strip */}
      <div className="grid grid-cols-3 gap-2 my-2.5 p-2 bg-[#030303] rounded-3xl border border-[#1f1f23] shadow-inner">
        {/* BPM Counter */}
        <div className="flex flex-col items-center justify-center bg-[#000000] p-1.5 rounded-3xl border border-[#18181b]">
          <span className="text-[8px] font-mono text-zinc-500 uppercase font-semibold">BPM / TEMPO</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white">
              {effectiveBPM}
            </span>
          </div>
          <span className="text-[8px] font-mono text-zinc-500">Orig: {originalBPM}</span>
        </div>

        {/* Camelot Musical Key */}
        <div className="flex flex-col items-center justify-center bg-[#000000] p-1.5 rounded-3xl border border-[#18181b]">
          <span className="text-[8px] font-mono text-zinc-500 uppercase font-semibold">KEY</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-zinc-200">
            {state.track ? state.track.key : '--'}
          </span>
          <span className="text-[7px] font-mono text-zinc-400 flex items-center gap-0.5">
            <Lock className="w-2 h-2" /> MASTER TEMPO
          </span>
        </div>

        {/* Time Elapsed / Remaining */}
        <div className="flex flex-col items-center justify-center bg-[#000000] p-1.5 rounded-3xl border border-[#18181b]">
          <span className="text-[8px] font-mono text-zinc-500 uppercase font-semibold">TIME REMAIN</span>
          <span className="text-sm sm:text-base font-mono font-bold text-zinc-200">
            -{remaining}
          </span>
          <span className="text-[8px] font-mono text-zinc-500">{elapsed}</span>
        </div>
      </div>

      {/* Main Platter & Pitch Fader Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-1">
        {/* Vinyl Jog Wheel */}
        <div className="flex-1 flex justify-center">
          <VinylJogWheel
            deckId={deckId}
            isPlaying={state.isPlaying}
            currentTime={state.currentTime}
            duration={state.duration}
            onScratchStart={onScratchStart}
            onScratchMove={onScratchMove}
            onScratchEnd={onScratchEnd}
            onPitchBend={onPitchBend}
            trackTitle={state.track?.title}
          />
        </div>

        {/* Pitch / Tempo Slider Fader */}
        <div className="flex flex-col items-center bg-[#050505] p-2 rounded-3xl border border-[#2a2a2a] w-full sm:w-16">
          <div className="flex items-center justify-between w-full text-[8px] font-mono font-bold text-zinc-400 mb-1">
            <span>PITCH</span>
            <span className="text-zinc-200">
              {Number(pitchPercent) > 0 ? `+${pitchPercent}` : pitchPercent}%
            </span>
          </div>

          {/* Slider Rail */}
          <div className="relative h-32 flex items-center justify-center my-1">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.001"
              value={state.pitchSlider}
              onChange={(e) => onPitchChange(parseFloat(e.target.value))}
              className="-rotate-90 w-28 cursor-pointer bg-transparent"
              title="Tempo Slider"
            />
          </div>

          {/* Pitch Bend / Reset Buttons */}
          <div className="flex items-center gap-1 mt-1 w-full justify-center">
            <button
              onClick={() => onPitchChange(0)}
              className="px-1.5 py-0.5 rounded-3xl text-[8px] font-mono font-bold bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800"
              title="Reset Pitch to 0%"
            >
              0%
            </button>
          </div>
        </div>
      </div>

      {/* Primary Transport Controls (SYNC, CUE, PLAY/PAUSE) */}
      <div className="grid grid-cols-3 gap-2 my-2.5">
        {/* 1-Click SYNC Button */}
        <button
          onClick={onSync}
          className={`h-12 rounded-3xl flex flex-col items-center justify-center font-black font-mono tracking-wider transition-all duration-100 border active:scale-95 ${
            state.isSync
              ? 'bg-white border-white text-black'
              : 'bg-[#0a0a0a] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
          }`}
          title="1-Click Beat Sync & Phase Match"
        >
          <div className="flex items-center gap-1 text-xs">
            <Zap className="w-3 h-3" />
            <span>SYNC</span>
          </div>
          <span className="text-[7px] font-mono opacity-70">BEAT LOCK</span>
        </button>

        {/* Pioneer-Style CUE Button */}
        <button
          onMouseDown={onPressCue}
          onMouseUp={onReleaseCue}
          onTouchStart={onPressCue}
          onTouchEnd={onReleaseCue}
          className={`h-12 rounded-3xl flex flex-col items-center justify-center font-black font-mono tracking-wider transition-all duration-100 border active:scale-95 ${
            state.isCuePressed
              ? 'bg-zinc-200 border-white text-black'
              : 'bg-[#0a0a0a] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
          }`}
          title="Hold CUE to preview or set cue point"
        >
          <span className="text-xs">CUE</span>
          <span className="text-[7px] font-mono opacity-70">KEY: C</span>
        </button>

        {/* Illuminated PLAY / PAUSE Button */}
        <button
          onClick={state.isPlaying ? onPause : onPlay}
          className={`h-12 rounded-3xl flex flex-col items-center justify-center font-black font-mono tracking-wider transition-all duration-100 border active:scale-95 ${
            state.isPlaying
              ? 'bg-white border-white text-black ring-1 ring-white/20 ring-offset-1 ring-offset-black'
              : 'bg-[#0a0a0a] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
          }`}
          title="Play / Pause Track"
        >
          <div className="flex items-center gap-1 text-xs">
            {state.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{state.isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </div>
          <span className="text-[7px] font-mono opacity-70">KEY: SPACE</span>
        </button>
      </div>

      {/* Performance Pads Matrix */}
      <PerformancePads
        deckState={state}
        onTriggerHotCue={onTriggerHotCue}
        onToggleLoop={onToggleLoop}
        onLoopHalve={onLoopHalve}
        onLoopDouble={onLoopDouble}
        onBeatJump={onBeatJump}
        onStartRoll={onStartRoll}
        onEndRoll={onEndRoll}
      />
    </div>
  );
};

export const Deck = memo(DeckComponent);
