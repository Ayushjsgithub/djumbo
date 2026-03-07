'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Spacebar', desc: 'Play / Pause Deck A', category: 'Deck A' },
    { key: 'C', desc: 'CUE Point (Hold/Set) Deck A', category: 'Deck A' },
    { key: 'S', desc: '1-Click SYNC Deck A to Deck B', category: 'Deck A' },
    { key: 'Q / W', desc: 'Pitch Nudge (-) / (+)', category: 'Deck A' },
    { key: 'E / R', desc: 'Loop Halve (1/2) / Double (2X)', category: 'Deck A' },
    { key: 'K', desc: 'Play / Pause Deck B', category: 'Deck B' },
    { key: 'L', desc: 'CUE Point (Hold/Set) Deck B', category: 'Deck B' },
    { key: ';', desc: '1-Click SYNC Deck B to Deck A', category: 'Deck B' },
    { key: 'O / P', desc: 'Pitch Nudge (-) / (+)', category: 'Deck B' },
    { key: 'U / I', desc: 'Loop Halve (1/2) / Double (2X)', category: 'Deck B' },
    { key: 'X', desc: 'Snap Crossfader 100% to Deck A', category: 'Mixer' },
    { key: 'C', desc: 'Snap Crossfader to Center (50/50)', category: 'Mixer' },
    { key: 'V', desc: 'Snap Crossfader 100% to Deck B', category: 'Mixer' },
    { key: 'F', desc: 'Toggle Fullscreen', category: 'Global' },
    { key: '1 - 7', desc: 'Trigger DJ Drops & Soundboard Samples', category: 'Soundboard' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#000000] border border-[#27272a] rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#18181b]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-mono font-bold text-white">
              KEYBOARD SHORTCUTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-3xl bg-[#0d0d0d] hover:bg-[#1c1c1f] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="overflow-y-auto py-3 pr-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[9px] text-zinc-500 border-b border-[#18181b]">
              <tr>
                <th className="py-2 px-3">KEY</th>
                <th className="py-2 px-3">FUNCTION</th>
                <th className="py-2 px-3 text-right">SECTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141416]">
              {shortcuts.map((s, idx) => (
                <tr key={idx} className="hover:bg-[#080808] transition-colors">
                  <td className="py-2 px-3 font-bold text-white">
                    <kbd className="px-2 py-0.5 rounded-3xl bg-[#141416] border border-zinc-800 text-zinc-200">
                      {s.key}
                    </kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-300">{s.desc}</td>
                  <td className="py-2 px-3 text-right text-[9px] text-zinc-500">{s.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#18181b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-3xl bg-white text-black text-xs font-mono font-bold hover:bg-zinc-200 active:scale-95 transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
