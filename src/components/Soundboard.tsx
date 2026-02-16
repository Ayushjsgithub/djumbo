'use client';

import React, { useState, memo } from 'react';
import { DEFAULT_SOUNDBOARD_SAMPLES } from '../lib/audio/SoundboardAudio';
import { Radio } from 'lucide-react';

interface SoundboardProps {
  onTriggerSample: (sampleId: string) => void;
  onClose?: () => void;
}

const SoundboardComponent: React.FC<SoundboardProps> = ({ onTriggerSample, onClose }) => {
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const handleTrigger = (id: string) => {
    setActiveSampleId(id);
    onTriggerSample(id);
    setTimeout(() => setActiveSampleId(null), 250);
  };

  return (
    <div className="flex flex-col bg-[#000000] border border-[#222222] rounded-3xl p-3 relative group">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#18181b]">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono font-bold text-zinc-200 tracking-wider">
            DJ DROPS & SOUNDBOARD
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-zinc-500">
            KEYS: NUM 1 - 7
          </span>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Close Panel"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Soundboard Pads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
        {DEFAULT_SOUNDBOARD_SAMPLES.map((sample) => {
          const isActive = activeSampleId === sample.id;
          return (
            <button
              key={sample.id}
              onClick={() => handleTrigger(sample.id)}
              className={`h-auto min-h-[56px] rounded-2xl flex flex-col items-center justify-center px-2 py-2 font-mono font-bold transition-all border select-none active:scale-95 ${
                isActive
                  ? 'bg-white text-black border-white'
                  : 'bg-[#080808] border-[#1f1f23] text-zinc-200 hover:border-zinc-700 hover:bg-[#141416]'
              }`}
            >
              <span className="text-[10px] font-black tracking-tight text-center leading-tight px-1 break-words">
                {sample.name}
              </span>
              <div className="flex flex-wrap justify-center items-center gap-1 mt-1 text-[7px] opacity-70">
                <span className="px-1.5 rounded-lg bg-[#000000] text-zinc-400 border border-zinc-800 flex-shrink-0">
                  [{sample.keyShortcut}]
                </span>
                <span className="text-center">{sample.category}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Soundboard = memo(SoundboardComponent);
