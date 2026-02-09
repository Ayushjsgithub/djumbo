'use client';

import React, { useState, memo } from 'react';
import { DeckState } from '../lib/types/dj';
import { Bookmark, Repeat, FastForward, Sparkles } from 'lucide-react';

interface PerformancePadsProps {
  deckState: DeckState;
  onTriggerHotCue: (index: number, isShift: boolean) => void;
  onToggleLoop: (beats: number) => void;
  onLoopHalve: () => void;
  onLoopDouble: () => void;
  onBeatJump: (beats: number) => void;
  onStartRoll: (beats: number) => void;
  onEndRoll: () => void;
}

const PerformancePadsComponent: React.FC<PerformancePadsProps> = ({
  deckState,
  onTriggerHotCue,
  onToggleLoop,
  onLoopHalve,
  onLoopDouble,
  onBeatJump,
  onStartRoll,
  onEndRoll,
}) => {
  const [padMode, setPadMode] = useState<'HOT_CUE' | 'AUTO_LOOP' | 'BEAT_JUMP' | 'ROLL'>('HOT_CUE');
  const [isShiftActive, setIsShiftActive] = useState(false);

  const loopLengths = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16];
  const loopLabels = ['1/8', '1/4', '1/2', '1', '2', '4', '8', '16'];

  const beatJumpLengths = [-8, -4, -2, -1, 1, 2, 4, 8];
  const beatJumpLabels = ['-8', '-4', '-2', '-1', '+1', '+2', '+4', '+8'];

  const rollLengths = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8];
  const rollLabels = ['1/16', '1/8', '1/4', '1/2', '1', '2', '4', '8'];

  return (
    <div className="flex flex-col bg-[#000000] border border-[#1f1f23] rounded-3xl p-2.5">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-[#18181b]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPadMode('HOT_CUE')}
            className={`px-2 py-1 rounded-3xl text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 transition-all ${
              padMode === 'HOT_CUE'
                ? 'bg-white text-black'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            HOT CUE
          </button>

          <button
            onClick={() => setPadMode('AUTO_LOOP')}
            className={`px-2 py-1 rounded-3xl text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 transition-all ${
              padMode === 'AUTO_LOOP'
                ? 'bg-white text-black'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Repeat className="w-3 h-3" />
            LOOP
          </button>

          <button
            onClick={() => setPadMode('BEAT_JUMP')}
            className={`px-2 py-1 rounded-3xl text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 transition-all ${
              padMode === 'BEAT_JUMP'
                ? 'bg-white text-black'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FastForward className="w-3 h-3" />
            JUMP
          </button>

          <button
            onClick={() => setPadMode('ROLL')}
            className={`px-2 py-1 rounded-3xl text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 transition-all ${
              padMode === 'ROLL'
                ? 'bg-white text-black'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            ROLL
          </button>
        </div>

        {/* Shift Button for Clearing Hot Cues */}
        {padMode === 'HOT_CUE' && (
          <button
            onClick={() => setIsShiftActive(!isShiftActive)}
            className={`px-2 py-0.5 rounded-3xl text-[8px] font-bold font-mono border transition-all ${
              isShiftActive
                ? 'bg-red-950 border-red-500 text-red-300'
                : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
            }`}
            title="Toggle Shift to Delete Cues"
          >
            SHIFT {isShiftActive ? '(DEL)' : ''}
          </button>
        )}

        {/* Loop Halve / Double buttons */}
        {padMode === 'AUTO_LOOP' && (
          <div className="flex items-center gap-1">
            <button
              onClick={onLoopHalve}
              className="px-1.5 py-0.5 rounded-3xl bg-[#0a0a0a] text-zinc-300 hover:text-white text-[8px] font-bold font-mono border border-zinc-800 active:scale-95"
            >
              1/2
            </button>
            <button
              onClick={onLoopDouble}
              className="px-1.5 py-0.5 rounded-3xl bg-[#0a0a0a] text-zinc-300 hover:text-white text-[8px] font-bold font-mono border border-zinc-800 active:scale-95"
            >
              2X
            </button>
          </div>
        )}
      </div>

      {/* 8-Pad Silicone Matrix Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* HOT CUE MODE */}
        {padMode === 'HOT_CUE' &&
          deckState.hotCues.map((cue, idx) => {
            const isSet = !!cue;
            return (
              <button
                key={idx}
                onClick={() => onTriggerHotCue(idx, isShiftActive)}
                className={`h-11 rounded-3xl flex flex-col items-center justify-center p-1 font-mono text-[9px] font-bold transition-all border active:scale-95 ${
                  isSet
                    ? isShiftActive
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-[#18181b] border-zinc-500 text-white'
                    : 'bg-[#080808] border-[#1f1f23] text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                }`}
              >
                <span>CUE {idx + 1}</span>
                <span className="text-[7px] opacity-75 font-normal">
                  {isSet ? `${Math.floor(cue.position)}s` : isShiftActive ? 'DEL' : 'SET'}
                </span>
              </button>
            );
          })}

        {/* AUTO LOOP MODE */}
        {padMode === 'AUTO_LOOP' &&
          loopLengths.map((len, idx) => {
            const isActive = deckState.loop.active && Math.abs(deckState.loop.lengthBeats - len) < 0.01;
            return (
              <button
                key={idx}
                onClick={() => onToggleLoop(len)}
                className={`h-11 rounded-3xl flex flex-col items-center justify-center p-1 font-mono text-[9px] font-bold transition-all border active:scale-95 ${
                  isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-[#080808] border-[#1f1f23] text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <span>{loopLabels[idx]}</span>
                <span className="text-[7px] text-zinc-500 font-normal">BEATS</span>
              </button>
            );
          })}

        {/* BEAT JUMP MODE */}
        {padMode === 'BEAT_JUMP' &&
          beatJumpLengths.map((beats, idx) => (
            <button
              key={idx}
              onClick={() => onBeatJump(beats)}
              className="h-11 rounded-3xl flex flex-col items-center justify-center p-1 font-mono text-[9px] font-bold bg-[#080808] border border-[#1f1f23] text-zinc-300 hover:bg-[#18181b] hover:text-white active:scale-95 transition-all"
            >
              <span>{beatJumpLabels[idx]}</span>
              <span className="text-[7px] text-zinc-500 font-normal">BARS</span>
            </button>
          ))}

        {/* BEAT ROLL STUTTER MODE */}
        {padMode === 'ROLL' &&
          rollLengths.map((beats, idx) => (
            <button
              key={idx}
              onMouseDown={() => onStartRoll(beats)}
              onMouseUp={onEndRoll}
              onTouchStart={() => onStartRoll(beats)}
              onTouchEnd={onEndRoll}
              className="h-11 rounded-3xl flex flex-col items-center justify-center p-1 font-mono text-[9px] font-bold bg-[#080808] border border-[#1f1f23] text-zinc-300 hover:bg-[#18181b] active:bg-white active:text-black active:scale-95 transition-all select-none"
            >
              <span>{rollLabels[idx]}</span>
              <span className="text-[7px] text-zinc-500 font-normal">HOLD</span>
            </button>
          ))}
      </div>
    </div>
  );
};

export const PerformancePads = memo(PerformancePadsComponent);
