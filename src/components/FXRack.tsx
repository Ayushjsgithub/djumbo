'use client';

import React, { memo } from 'react';
import { FXState } from '../lib/types/dj';
import { RotaryKnob } from './RotaryKnob';
import { XYPad } from './XYPad';
import { Wand2 } from 'lucide-react';

interface FXRackProps {
  deckId: 'A' | 'B';
  fxList: FXState[];
  color?: string;
  onToggleFX: (fxId: string) => void;
  onSetFXParam: (fxId: string, wet: number, param1?: number, param2?: number) => void;
  onFilterSweep: (filterVal: number) => void;
  onClose?: () => void;
}

const FXRackComponent: React.FC<FXRackProps> = ({
  deckId,
  fxList,
  onToggleFX,
  onSetFXParam,
  onFilterSweep,
  onClose,
}) => {
  const echoFX = fxList.find(f => f.id === 'echo');
  const flangerFX = fxList.find(f => f.id === 'flanger');

  return (
    <div className="flex flex-col bg-[#000000] border border-[#222222] rounded-3xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#18181b]">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono font-bold text-zinc-200 tracking-wider">
            DECK {deckId} FX & FILTER
          </span>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* FX Units */}
        <div className="flex flex-col gap-2">
          {/* ECHO / DELAY UNIT */}
          {echoFX && (
            <div className="flex items-center justify-between bg-[#050505] p-2 rounded-3xl border border-[#1c1c1f]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleFX('echo')}
                  className={`px-2 py-1 rounded-3xl text-[9px] font-mono font-bold border transition-all ${
                    echoFX.active
                      ? 'bg-white border-white text-black'
                      : 'bg-[#0a0a0a] border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  ECHO {echoFX.active ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <RotaryKnob
                  label="BEATS"
                  value={echoFX.param1}
                  min={0}
                  max={1}
                  defaultValue={0.5}
                  size={32}
                  color="#ffffff"
                  onChange={(val) => onSetFXParam('echo', echoFX.wet, val, echoFX.param2)}
                />
                <RotaryKnob
                  label="FDBK"
                  value={echoFX.param2}
                  min={0}
                  max={0.9}
                  defaultValue={0.4}
                  size={32}
                  color="#ffffff"
                  onChange={(val) => onSetFXParam('echo', echoFX.wet, echoFX.param1, val)}
                />
                <RotaryKnob
                  label="WET"
                  value={echoFX.wet}
                  min={0}
                  max={1}
                  defaultValue={0.5}
                  size={32}
                  color="#ffffff"
                  onChange={(val) => onSetFXParam('echo', val, echoFX.param1, echoFX.param2)}
                />
              </div>
            </div>
          )}

          {/* FLANGER / PHASER UNIT */}
          {flangerFX && (
            <div className="flex items-center justify-between bg-[#050505] p-2 rounded-3xl border border-[#1c1c1f]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleFX('flanger')}
                  className={`px-2 py-1 rounded-3xl text-[9px] font-mono font-bold border transition-all ${
                    flangerFX.active
                      ? 'bg-white border-white text-black'
                      : 'bg-[#0a0a0a] border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  FLANGER {flangerFX.active ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <RotaryKnob
                  label="DEPTH"
                  value={flangerFX.param1}
                  min={0}
                  max={1}
                  defaultValue={0.5}
                  size={32}
                  color="#ffffff"
                  onChange={(val) => onSetFXParam('flanger', flangerFX.wet, val, flangerFX.param2)}
                />
                <RotaryKnob
                  label="WET"
                  value={flangerFX.wet}
                  min={0}
                  max={1}
                  defaultValue={0.5}
                  size={32}
                  color="#ffffff"
                  onChange={(val) => onSetFXParam('flanger', val, flangerFX.param1, flangerFX.param2)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live XY Touch Expression Pad */}
        <div>
          <XYPad
            label={`DECK ${deckId} TOUCH PAD`}
            xParamName="FILTER"
            yParamName="ECHO"
            onXYChange={(x, y) => {
              const filterVal = (x - 0.5) * 2;
              onFilterSweep(filterVal);

              if (echoFX) {
                onSetFXParam('echo', y, echoFX.param1, echoFX.param2);
              }
            }}
            onXYRelease={() => {
              onFilterSweep(0);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const FXRack = memo(FXRackComponent);
