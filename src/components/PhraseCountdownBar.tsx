'use client';

import React, { memo } from 'react';
import { DeckState } from '../lib/types/dj';
import { Flame, Clock, Sparkles, Volume2, ArrowRightLeft } from 'lucide-react';

interface PhraseCountdownBarProps {
  deckA: DeckState;
  deckB: DeckState;
  onOneTouchTransition: (type: 'smooth' | 'drop' | 'echoOut' | 'bassSwap') => void;
  isTransitioning: boolean;
  onClose?: () => void;
}

const PhraseCountdownBarComponent: React.FC<PhraseCountdownBarProps> = ({
  deckA,
  deckB,
  onOneTouchTransition,
  isTransitioning,
  onClose,
}) => {
  // Determine master active deck
  const activeDeck = deckA.isPlaying ? deckA : (deckB.isPlaying ? deckB : deckA);
  const activeBPM = activeDeck.track ? activeDeck.track.bpm * activeDeck.playbackRate : 128;
  const beatSec = 60 / activeBPM;
  const currentBeat = Math.floor(activeDeck.currentTime / beatSec);
  const barNumber = Math.floor(currentBeat / 4) + 1;
  const beatInBar = (currentBeat % 4) + 1;

  // 32-beat (8-bar) or 64-beat phrase progress
  const beatsToNextDrop = 32 - (currentBeat % 32);
  const barsToNextDrop = Math.ceil(beatsToNextDrop / 4);

  // Section detector
  let phraseName = 'INTRO';
  let phraseColor = 'text-zinc-400';
  let isDropComing = false;

  const phraseProgress = (currentBeat % 32) / 32;

  if ((currentBeat % 64) >= 48 && (currentBeat % 64) < 64) {
    phraseName = 'BUILDUP / DROP APPROACHING';
    phraseColor = 'text-amber-400';
    isDropComing = true;
  } else if ((currentBeat % 64) < 32 && currentBeat > 8) {
    phraseName = 'MAIN DROP';
    phraseColor = 'text-white';
  } else if ((currentBeat % 64) >= 32 && (currentBeat % 64) < 48) {
    phraseName = 'BREAKDOWN / MELODY';
    phraseColor = 'text-zinc-300';
  }

  return (
    <div className="flex flex-col bg-[#050505] border border-[#222222] rounded-3xl p-3 shadow-lg relative group">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-[#111111] border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors z-10 hidden sm:flex opacity-0 group-hover:opacity-100"
          title="Close Phrase Bar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      {/* Top Bar Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-[#18181b] pr-8">
        {/* Realtime Phrase & Beat Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-3xl bg-[#111111] border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-mono text-zinc-400">BEAT:</span>
            <span className="text-xs font-mono font-black text-white">
              BAR {barNumber} : {beatInBar}/4
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-mono font-bold uppercase ${phraseColor}`}>
              {phraseName}
            </span>
          </div>
        </div>

        {/* Drop Countdown Badge */}
        <div className="flex items-center gap-2">
          {activeDeck.isPlaying && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-3xl border text-xs font-mono font-bold transition-all ${
              isDropComing
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-[#111111] border-zinc-800 text-zinc-300'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${isDropComing ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span>
                {beatsToNextDrop <= 8
                  ? `DROP IN ${beatsToNextDrop} BEATS`
                  : `NEXT DROP IN ${barsToNextDrop} BARS (${beatsToNextDrop} BEATS)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Visual 32-Beat Phrase Progress Bar */}
      <div className="my-2">
        <div className="flex justify-between text-[8px] font-mono text-zinc-500 mb-1">
          <span>PHRASE START</span>
          <span>MID BREAK</span>
          <span>THE DROP</span>
        </div>
        <div className="relative w-full h-2 bg-[#111111] rounded-3xl overflow-hidden border border-zinc-800">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-zinc-300 to-white transition-all duration-100"
            style={{ width: `${phraseProgress * 100}%` }}
          />
        </div>
      </div>

      {/* One-Touch DJ Transition Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
        <button
          onClick={() => onOneTouchTransition('smooth')}
          disabled={isTransitioning}
          className="px-2.5 py-2 rounded-3xl bg-[#141416] hover:bg-[#222226] text-white text-xs font-mono font-bold border border-zinc-700 border-t-zinc-500 active:scale-95 transition-all flex flex-col items-center justify-center text-center shadow-md"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-zinc-300" />
            <span>SMOOTH BLEND</span>
          </div>
          <span className="text-[7px] text-zinc-400 font-normal mt-0.5">
            Auto-Sync + 4-Bar Crossfade
          </span>
        </button>

        <button
          onClick={() => onOneTouchTransition('drop')}
          disabled={isTransitioning}
          className="px-2.5 py-2 rounded-3xl bg-[#141416] hover:bg-[#222226] text-white text-xs font-mono font-bold border border-zinc-700 border-t-zinc-500 active:scale-95 transition-all flex flex-col items-center justify-center text-center shadow-md"
        >
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-zinc-300" />
            <span>DROP ON THE 1</span>
          </div>
          <span className="text-[7px] text-zinc-400 font-normal mt-0.5">
            Instant Drop Switch on Downbeat
          </span>
        </button>

        <button
          onClick={() => onOneTouchTransition('bassSwap')}
          disabled={isTransitioning}
          className="px-2.5 py-2 rounded-3xl bg-[#141416] hover:bg-[#222226] text-white text-xs font-mono font-bold border border-zinc-700 border-t-zinc-500 active:scale-95 transition-all flex flex-col items-center justify-center text-center shadow-md"
        >
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-zinc-300" />
            <span>BASS SWAP</span>
          </div>
          <span className="text-[7px] text-zinc-400 font-normal mt-0.5">
            Instant Low-End Bassline Switch
          </span>
        </button>

        <button
          onClick={() => onOneTouchTransition('echoOut')}
          disabled={isTransitioning}
          className="px-2.5 py-2 rounded-3xl bg-[#141416] hover:bg-[#222226] text-white text-xs font-mono font-bold border border-zinc-700 border-t-zinc-500 active:scale-95 transition-all flex flex-col items-center justify-center text-center shadow-md"
        >
          <div className="flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-zinc-300" />
            <span>ECHO OUT & CUT</span>
          </div>
          <span className="text-[7px] text-zinc-400 font-normal mt-0.5">
            Echo tail fade into other deck
          </span>
        </button>
      </div>
    </div>
  );
};

export const PhraseCountdownBar = memo(PhraseCountdownBarComponent);
