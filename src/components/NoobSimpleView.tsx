'use client';

import React, { useState, memo } from 'react';
import { DeckState, Track } from '../lib/types/dj';
import { Play, Pause, Zap, ArrowRightLeft, Music, Volume2, Sparkles, Flame, Radio, Sliders, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { DEFAULT_SOUNDBOARD_SAMPLES } from '../lib/audio/SoundboardAudio';
import { motion } from 'motion/react';

interface NoobSimpleViewProps {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  onPlayA: () => void;
  onPauseA: () => void;
  onPlayB: () => void;
  onPauseB: () => void;
  onSyncA: () => void;
  onSyncB: () => void;
  onSeekA: (time: number) => void;
  onSeekB: (time: number) => void;
  onSetEQLowA: (val: number) => void;
  onSetEQLowB: (val: number) => void;
  onSetFilterA: (val: number) => void;
  onSetFilterB: (val: number) => void;
  onSetCrossfader: (val: number) => void;
  onAutoMix: () => void;
  isAutoMixing: boolean;
  onTriggerSample: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenGuide?: () => void;
}

const NoobSimpleViewComponent: React.FC<NoobSimpleViewProps> = ({
  deckA,
  deckB,
  crossfader,
  onPlayA,
  onPauseA,
  onPlayB,
  onPauseB,
  onSyncA,
  onSyncB,
  onSeekA,
  onSeekB,
  onSetEQLowA,
  onSetEQLowB,
  onSetFilterA,
  onSetFilterB,
  onSetCrossfader,
  onAutoMix,
  isAutoMixing,
  onTriggerSample,
  onOpenLibrary,
  onOpenGuide,
}) => {
  const activeDeckIsA = crossfader < 0.5;
  const [showCheatSheet, setShowCheatSheet] = useState(true);

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full select-none">
      
      {/* Visual 3-Step Beginner Cheat Sheet Card */}
      {showCheatSheet && (
        <div className="bg-[#050505] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-xs flex flex-col gap-3 relative group">
          <button
            onClick={() => setShowCheatSheet(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#111111] border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors z-10 hidden sm:flex opacity-0 group-hover:opacity-100"
            title="Close Instructions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80 pr-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-3xl bg-white text-black flex items-center justify-center font-bold">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-white text-xs sm:text-sm">
                  HOW TO MIX YOUR FIRST 2 SONGS (3 EASY STEPS)
                </h3>
                <p className="text-[10px] text-zinc-400 font-sans">
                  Follow these 3 steps in order to do a clean transition right now:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCheatSheet(false)}
                className="sm:hidden px-2 py-1.5 rounded-3xl bg-[#141416] hover:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-800 transition-all active:scale-95"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span>CLOSE</span>
              </button>
              {onOpenGuide && (
                <button
                  onClick={onOpenGuide}
                  className="px-3 py-1.5 rounded-3xl bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700 text-zinc-200 font-mono font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>FULL GUIDE & GLOSSARY</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Step Interactive Workflow Indicator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            
            {/* Step 1 */}
            <div className={`p-3 rounded-3xl border transition-all ${
              deckA.isPlaying 
                ? 'bg-zinc-950 border-emerald-800/60' 
                : 'bg-[#000000] border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-[11px] text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">1</span>
                  PLAY SONG 1 (DECK A)
                </span>
                {deckA.isPlaying && <span className="text-[9px] font-mono text-emerald-400 font-bold">ACTIVE</span>}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                Press the big white <strong>PLAY SONG 1</strong> button below to start the music.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={deckA.isPlaying ? onPauseA : onPlayA}
                className={`w-full py-2 rounded-3xl text-xs font-mono font-bold border transition-colors ${
                  deckA.isPlaying
                    ? 'bg-white text-black border-white'
                    : 'bg-[#111111] hover:bg-[#1a1a1a] text-white border-zinc-700'
                }`}
              >
                {deckA.isPlaying ? 'SONG 1 IS PLAYING' : 'CLICK TO PLAY SONG 1'}
              </motion.button>
            </div>

            {/* Step 2 */}
            <div className={`p-3 rounded-3xl border transition-all ${
              deckB.isSync 
                ? 'bg-zinc-950 border-emerald-800/60' 
                : 'bg-[#000000] border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-[11px] text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[10px]">2</span>
                  MATCH SPEED (SYNC)
                </span>
                {deckB.isSync && <span className="text-[9px] font-mono text-emerald-400 font-bold">LOCKED</span>}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                Click <strong>MATCH SPEED</strong> on Song 2 so both songs run at the exact same tempo.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSyncB}
                className={`w-full py-2 rounded-3xl text-xs font-mono font-bold border transition-colors ${
                  deckB.isSync
                    ? 'bg-white text-black border-white'
                    : 'bg-[#111111] hover:bg-[#1a1a1a] text-white border-zinc-700'
                }`}
              >
                {deckB.isSync ? 'SPEED IS MATCHED' : 'CLICK TO MATCH SPEED'}
              </motion.button>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-3xl bg-[#000000] border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-[11px] text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px]">3</span>
                  CLICK MAGIC TRANSITION
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">
                When you want to switch songs, click the big <strong>1-CLICK MAGIC TRANSITION</strong> button below!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAutoMix}
                disabled={isAutoMixing}
                className="w-full py-2 rounded-3xl bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700 text-white text-xs font-mono font-bold transition-colors"
              >
                {isAutoMixing ? 'TRANSITIONING...' : 'TRIGGER AUTO MIX'}
              </motion.button>
            </div>

          </div>
        </div>
      )}

      {/* Main Dual Deck Beginner Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SONG 1 (DECK A) */}
        <div className={`flex flex-col bg-[#050505] border rounded-3xl p-4 sm:p-5 shadow-xl transition-all ${
          activeDeckIsA ? 'border-white/40' : 'border-[#1f1f23]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#18181b]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-3xl bg-[#18181b] border border-zinc-700 text-white font-mono font-bold text-xs">
                SONG 1
              </span>
              <div>
                <h4 className="font-bold text-white text-sm truncate max-w-[180px] sm:max-w-[220px]">
                  {deckA.track ? deckA.track.title : 'No Song Loaded'}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {deckA.track ? deckA.track.artist : 'Click "Choose Songs" below'}
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs font-bold text-zinc-200">
                {deckA.track ? `${(deckA.track.bpm * deckA.playbackRate).toFixed(1)} BPM` : '128 BPM'}
              </span>
            </div>
          </div>

          {/* Big Play / Pause & Sync Controls */}
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <button
              onClick={deckA.isPlaying ? onPauseA : onPlayA}
              className={`h-16 rounded-3xl flex items-center justify-center gap-2 font-mono font-bold text-sm transition-all border active:scale-95 shadow-md ${
                deckA.isPlaying
                  ? 'bg-white text-black border-white'
                  : 'bg-[#111111] border-zinc-700 text-white hover:bg-[#1c1c20]'
              }`}
            >
              {deckA.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{deckA.isPlaying ? 'PAUSE' : 'PLAY SONG 1'}</span>
            </button>

            <button
              onClick={onSyncA}
              className={`h-16 rounded-3xl flex flex-col items-center justify-center font-mono font-bold text-xs transition-all border active:scale-95 ${
                deckA.isSync
                  ? 'bg-white text-black border-white'
                  : 'bg-[#0d0d0d] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>MATCH SPEED</span>
              </div>
              <span className="text-[8px] opacity-70 font-normal mt-1 text-center px-2">Matches the beat perfectly to Song 2 so they don't clash</span>
            </button>
          </div>

          {/* Quick Jump Drop Shortcuts */}
          <div className="flex flex-col gap-1.5 my-1 bg-[#0a0a0a] p-2.5 rounded-3xl border border-[#1f1f23]">
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold text-center w-full block">
              JUMP TO SECTIONS (Instantly skip to the best parts)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onSeekA(0)}
                className="py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-zinc-300 hover:text-white text-[10px] font-mono font-bold border border-zinc-800"
              >
                START
              </button>
              <button
                onClick={() => deckA.track && onSeekA(deckA.track.duration * 0.4)}
                className="py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-zinc-300 hover:text-white text-[10px] font-mono font-bold border border-zinc-800"
              >
                BUILD-UP
              </button>
              <button
                onClick={() => deckA.track && onSeekA(deckA.track.duration * 0.52)}
                className="py-1.5 rounded-3xl bg-[#1c1c20] hover:bg-[#282830] text-white text-[10px] font-mono font-bold border border-zinc-600 flex items-center justify-center gap-1"
              >
                <Flame className="w-3 h-3 text-zinc-300" />
                THE DROP
              </button>
            </div>
          </div>

          {/* Simple Bass Slider */}
          <div className="flex flex-col gap-1 my-3 bg-[#0a0a0a] p-3 rounded-3xl border border-[#1f1f23]">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-zinc-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> BASS LEVEL
              </span>
              <span className="text-zinc-400">
                {deckA.eqLow <= -20 ? 'MUTED (READY TO MIX)' : deckA.eqLow === 0 ? 'NORMAL (100%)' : `${deckA.eqLow.toFixed(0)} dB`}
              </span>
            </div>
            <input
              type="range"
              min="-24"
              max="0"
              step="1"
              value={deckA.eqLow}
              onChange={(e) => onSetEQLowA(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#141416] rounded-3xl cursor-pointer border border-zinc-800"
            />
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
              <span className="w-1/2 text-left">← CUT BASS<br/>(Use when mixing)</span>
              <span className="w-1/2 text-right">FULL BASS →<br/>(Normal playing)</span>
            </div>
          </div>

          {/* Simple Filter Sweep Slider */}
          <div className="flex flex-col gap-1 bg-[#0a0a0a] p-3 rounded-3xl border border-[#1f1f23]">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-zinc-300">SOUND FILTER EFFECT</span>
              <span className="text-zinc-400">
                {deckA.filter === 0 ? 'CLEAN (OFF)' : deckA.filter > 0 ? 'HIGH-PASS' : 'LOW-PASS'}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={deckA.filter}
              onChange={(e) => onSetFilterA(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#141416] rounded-3xl cursor-pointer border border-zinc-800"
            />
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
              <span className="w-1/3 text-left">← UNDERWATER<br/>(Low-pass)</span>
              <span className="w-1/3 text-center">NORMAL</span>
              <span className="w-1/3 text-right">AIRY SWEEP →<br/>(High-pass)</span>
            </div>
          </div>
        </div>

        {/* SONG 2 (DECK B) */}
        <div className={`flex flex-col bg-[#050505] border rounded-3xl p-4 sm:p-5 shadow-xl transition-all ${
          !activeDeckIsA ? 'border-white/40' : 'border-[#1f1f23]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#18181b]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-3xl bg-[#18181b] border border-zinc-700 text-white font-mono font-bold text-xs">
                SONG 2
              </span>
              <div>
                <h4 className="font-bold text-white text-sm truncate max-w-[180px] sm:max-w-[220px]">
                  {deckB.track ? deckB.track.title : 'No Song Loaded'}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  {deckB.track ? deckB.track.artist : 'Click "Choose Songs" below'}
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs font-bold text-zinc-200">
                {deckB.track ? `${(deckB.track.bpm * deckB.playbackRate).toFixed(1)} BPM` : '128 BPM'}
              </span>
            </div>
          </div>

          {/* Big Play / Pause & Sync Controls */}
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <button
              onClick={deckB.isPlaying ? onPauseB : onPlayB}
              className={`h-16 rounded-3xl flex items-center justify-center gap-2 font-mono font-bold text-sm transition-all border active:scale-95 shadow-md ${
                deckB.isPlaying
                  ? 'bg-white text-black border-white'
                  : 'bg-[#111111] border-zinc-700 text-white hover:bg-[#1c1c20]'
              }`}
            >
              {deckB.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{deckB.isPlaying ? 'PAUSE' : 'PLAY SONG 2'}</span>
            </button>

            <button
              onClick={onSyncB}
              className={`h-16 rounded-3xl flex flex-col items-center justify-center font-mono font-bold text-xs transition-all border active:scale-95 ${
                deckB.isSync
                  ? 'bg-white text-black border-white'
                  : 'bg-[#0d0d0d] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>MATCH SPEED</span>
              </div>
              <span className="text-[8px] opacity-70 font-normal mt-1 text-center px-2">Matches the beat perfectly to Song 1 so they don't clash</span>
            </button>
          </div>

          {/* Quick Jump Drop Shortcuts */}
          <div className="flex flex-col gap-1.5 my-1 bg-[#0a0a0a] p-2.5 rounded-3xl border border-[#1f1f23]">
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold text-center w-full block">
              JUMP TO SECTIONS (Instantly skip to the best parts)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onSeekB(0)}
                className="py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-zinc-300 hover:text-white text-[10px] font-mono font-bold border border-zinc-800"
              >
                START
              </button>
              <button
                onClick={() => deckB.track && onSeekB(deckB.track.duration * 0.4)}
                className="py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-zinc-300 hover:text-white text-[10px] font-mono font-bold border border-zinc-800"
              >
                BUILD-UP
              </button>
              <button
                onClick={() => deckB.track && onSeekB(deckB.track.duration * 0.52)}
                className="py-1.5 rounded-3xl bg-[#1c1c20] hover:bg-[#282830] text-white text-[10px] font-mono font-bold border border-zinc-600 flex items-center justify-center gap-1"
              >
                <Flame className="w-3 h-3 text-zinc-300" />
                THE DROP
              </button>
            </div>
          </div>

          {/* Simple Bass Slider */}
          <div className="flex flex-col gap-1 my-3 bg-[#0a0a0a] p-3 rounded-3xl border border-[#1f1f23]">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-zinc-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> BASS LEVEL
              </span>
              <span className="text-zinc-400">
                {deckB.eqLow <= -20 ? 'MUTED (READY TO MIX)' : deckB.eqLow === 0 ? 'NORMAL (100%)' : `${deckB.eqLow.toFixed(0)} dB`}
              </span>
            </div>
            <input
              type="range"
              min="-24"
              max="0"
              step="1"
              value={deckB.eqLow}
              onChange={(e) => onSetEQLowB(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#141416] rounded-3xl cursor-pointer border border-zinc-800"
            />
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1">
              <span className="w-1/2 text-left">← CUT BASS<br/>(Use when mixing)</span>
              <span className="w-1/2 text-right">FULL BASS →<br/>(Normal playing)</span>
            </div>
          </div>

          {/* Simple Filter Sweep Slider */}
          <div className="flex flex-col gap-1 bg-[#0a0a0a] p-3 rounded-3xl border border-[#1f1f23]">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-zinc-300">SOUND FILTER EFFECT</span>
              <span className="text-zinc-400">
                {deckB.filter === 0 ? 'CLEAN (OFF)' : deckB.filter > 0 ? 'HIGH-PASS' : 'LOW-PASS'}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={deckB.filter}
              onChange={(e) => onSetFilterB(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#141416] rounded-3xl cursor-pointer border border-zinc-800"
            />
            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-0.5">
              <span>UNDERWATER</span>
              <span>CENTER (NORMAL)</span>
              <span>AIRY / HIGH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Big Central Magic Transition Controller */}
      <div className="flex flex-col items-center bg-[#050505] border border-[#222222] rounded-3xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-xs font-mono font-bold text-zinc-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightLeft className="w-4 h-4 text-white" />
          MASTER TRANSITION CONTROLLER
        </h3>

        {/* 1-Click Giant Auto Transition Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          animate={isAutoMixing ? {
            scale: [1, 1.03, 1],
            backgroundColor: 'rgba(255,255,255,1)',
            color: 'rgba(0,0,0,1)',
            borderColor: 'rgba(255,255,255,1)'
          } : {
            scale: 1,
            backgroundColor: 'rgba(24,24,27,1)',
            color: 'rgba(255,255,255,1)',
            borderColor: 'rgba(63,63,70,1)'
          }}
          transition={isAutoMixing ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          onClick={onAutoMix}
          disabled={isAutoMixing}
          className="w-full max-w-lg py-4 px-6 rounded-3xl flex items-center justify-center gap-2 font-black font-mono text-sm tracking-wider border shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isAutoMixing
              ? 'AUTOMATICALLY BLENDING SONGS...'
              : activeDeckIsA
              ? '1-CLICK MAGIC TRANSITION -> SWITCH TO SONG 2'
              : '1-CLICK MAGIC TRANSITION -> SWITCH TO SONG 1'}
          </span>
        </motion.button>

        {/* Manual Blend Slider */}
        <div className="w-full max-w-lg mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-mono font-bold">
            <span className={activeDeckIsA ? 'text-white' : 'text-zinc-500'}>HEAR ONLY SONG 1</span>
            <span className="text-zinc-400">HEAR BOTH SONGS (MIXING)</span>
            <span className={!activeDeckIsA ? 'text-white' : 'text-zinc-500'}>HEAR ONLY SONG 2</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfader}
            onChange={(e) => onSetCrossfader(parseFloat(e.target.value))}
            className="w-full h-3 bg-[#111111] rounded-full cursor-pointer border border-zinc-800"
          />
          <div className="text-[9px] text-zinc-500 font-sans text-center mt-2">
            <strong>Pro Tip:</strong> Slide this left and right to control which song the audience hears!
          </div>
        </div>
      </div>

      {/* 4 Essential DJ Soundboard Drops */}
      <div className="flex flex-col bg-[#050505] border border-[#222222] rounded-3xl p-4">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[#18181b]">
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono font-bold text-zinc-200">
            SOUND EFFECTS (INSTANT BUTTONS)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEFAULT_SOUNDBOARD_SAMPLES.slice(0, 4).map((sample) => (
            <button
              key={sample.id}
              onClick={() => onTriggerSample(sample.id)}
              className="py-3 px-2 rounded-3xl bg-[#111111] hover:bg-[#222226] text-white text-xs font-mono font-bold border border-zinc-800 active:bg-white active:text-black transition-all flex flex-col items-center justify-center gap-0.5"
            >
              <span>{sample.name}</span>
              <span className="text-[8px] text-zinc-500 font-normal">Press Key [{sample.keyShortcut}]</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const NoobSimpleView = memo(NoobSimpleViewComponent);
