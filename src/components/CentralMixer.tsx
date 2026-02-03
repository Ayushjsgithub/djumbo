'use client';

import React, { memo } from 'react';
import { DeckState, CrossfaderCurve } from '../lib/types/dj';
import { RotaryKnob } from './RotaryKnob';
import { VUMeter } from './VUMeter';
import { Wand2, Sliders, ShieldCheck } from 'lucide-react';

interface CentralMixerProps {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  curve: CrossfaderCurve;
  analyserA?: AnalyserNode;
  analyserB?: AnalyserNode;
  masterAnalyser?: AnalyserNode;
  onSetGainA: (val: number) => void;
  onSetGainB: (val: number) => void;
  onSetEQLowA: (val: number) => void;
  onSetEQMidA: (val: number) => void;
  onSetEQHighA: (val: number) => void;
  onToggleKillA: (band: 'low' | 'mid' | 'high') => void;
  onSetFilterA: (val: number) => void;
  onSetVolumeA: (val: number) => void;
  onSetEQLowB: (val: number) => void;
  onSetEQMidB: (val: number) => void;
  onSetEQHighB: (val: number) => void;
  onToggleKillB: (band: 'low' | 'mid' | 'high') => void;
  onSetFilterB: (val: number) => void;
  onSetVolumeB: (val: number) => void;
  onSetCrossfader: (val: number) => void;
  onSetCurve: (curve: CrossfaderCurve) => void;
  onAutoMix: () => void;
  isAutoMixing?: boolean;
}

const CentralMixerComponent: React.FC<CentralMixerProps> = ({
  deckA,
  deckB,
  crossfader,
  curve,
  analyserA,
  analyserB,
  masterAnalyser,
  onSetGainA,
  onSetGainB,
  onSetEQLowA,
  onSetEQMidA,
  onSetEQHighA,
  onToggleKillA,
  onSetFilterA,
  onSetVolumeA,
  onSetEQLowB,
  onSetEQMidB,
  onSetEQHighB,
  onToggleKillB,
  onSetFilterB,
  onSetVolumeB,
  onSetCrossfader,
  onSetCurve,
  onAutoMix,
  isAutoMixing = false,
}) => {
  return (
    <div className="flex flex-col bg-[#000000] border border-[#222222] rounded-3xl p-3 sm:p-4">
      {/* Mixer Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#18181b]">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono font-bold text-zinc-200 tracking-wider">
            MIXER CONSOLE
          </span>
        </div>

        {/* Master Limiter Protection Indicator */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-3xl bg-[#0d160f] border border-emerald-800 text-[8px] font-mono text-emerald-300">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>LIMITER ON</span>
        </div>
      </div>

      {/* Main Dual Channel Strips & Center Master */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 items-start">
        {/* CHANNEL A STRIP */}
        <div className="flex flex-col items-center bg-[#050505] p-2 rounded-3xl border border-[#1c1c1f]">
          <span className="text-[9px] font-mono font-bold text-zinc-300 tracking-wider mb-2">
            CH 1 (DECK A)
          </span>

          {/* Gain Trim */}
          <RotaryKnob
            label="TRIM"
            value={deckA.gain}
            min={0}
            max={2.0}
            defaultValue={1.0}
            step={0.05}
            color="#ffffff"
            size={38}
            onChange={onSetGainA}
          />

          <div className="w-full h-px bg-[#18181b] my-1.5" />

          {/* High EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="HI EQ"
              value={deckA.eqHigh}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQHighA}
            />
            <button
              onClick={() => onToggleKillA('high')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckA.killHigh
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL HI
            </button>
          </div>

          {/* Mid EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="MID EQ"
              value={deckA.eqMid}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQMidA}
            />
            <button
              onClick={() => onToggleKillA('mid')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckA.killMid
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL MID
            </button>
          </div>

          {/* Low EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="LOW EQ"
              value={deckA.eqLow}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQLowA}
            />
            <button
              onClick={() => onToggleKillA('low')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckA.killLow
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL BASS
            </button>
          </div>

          <div className="w-full h-px bg-[#18181b] my-1.5" />

          {/* Bi-directional HPF/LPF Filter */}
          <div className="my-0.5">
            <RotaryKnob
              label="FILTER (HPF/LPF)"
              value={deckA.filter}
              min={-1}
              max={1}
              defaultValue={0}
              color="#ffffff"
              size={40}
              centerDetent
              onChange={onSetFilterA}
            />
          </div>

          {/* Channel Fader & VU Meter */}
          <div className="flex items-center gap-2 mt-2 w-full justify-center">
            <div className="relative h-32 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={deckA.volume}
                onChange={(e) => onSetVolumeA(parseFloat(e.target.value))}
                className="-rotate-90 w-28 cursor-pointer bg-transparent"
                title="Deck A Volume"
              />
            </div>
            <VUMeter analyser={analyserA} height={100} label="CH 1" />
          </div>
        </div>

        {/* CENTER MASTER BUS & AUTO-MIX SECTION */}
        <div className="flex flex-col items-center justify-between h-full bg-[#050505] p-2 rounded-3xl border border-[#1c1c1f]">
          <div className="flex flex-col items-center w-full">
            <span className="text-[8px] font-mono font-bold text-zinc-400 tracking-wider mb-1.5">
              MASTER OUTPUT
            </span>
            <VUMeter analyser={masterAnalyser} height={90} label="MASTER" />
          </div>

          {/* Smart Auto-Mix / Transition Button */}
          <div className="flex flex-col items-center w-full my-2">
            <button
              onClick={onAutoMix}
              disabled={isAutoMixing}
              className={`w-full py-2 px-1.5 rounded-3xl flex flex-col items-center justify-center font-bold font-mono tracking-wider transition-all border ${
                isAutoMixing
                  ? 'bg-white text-black border-white animate-pulse'
                  : 'bg-[#121215] hover:bg-[#1f1f24] border-zinc-700 text-zinc-200 hover:text-white active:scale-95'
              }`}
              title="1-Click Smooth Beat & Bass Transition"
            >
              <div className="flex items-center gap-1 text-[10px]">
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isAutoMixing ? 'TRANSITIONING...' : 'SMART AUTO-MIX'}</span>
              </div>
              <span className="text-[7px] font-mono text-zinc-500 font-normal">
                BEAT & BASS SWAP
              </span>
            </button>
          </div>

          {/* Crossfader Curve Selector */}
          <div className="flex flex-col items-center w-full bg-[#000000] p-1.5 rounded-3xl border border-[#18181b] mb-1">
            <span className="text-[7px] font-mono font-bold text-zinc-500 mb-1 uppercase">
              X-Fader Curve
            </span>
            <div className="grid grid-cols-3 gap-1 w-full">
              {(['smooth', 'linear', 'scratch'] as CrossfaderCurve[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onSetCurve(c)}
                  className={`py-0.5 rounded-3xl text-[7px] font-mono font-bold uppercase transition-all ${
                    curve === c
                      ? 'bg-white text-black'
                      : 'bg-[#0a0a0a] text-zinc-500 hover:text-white border border-zinc-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHANNEL B STRIP */}
        <div className="flex flex-col items-center bg-[#050505] p-2 rounded-3xl border border-[#1c1c1f]">
          <span className="text-[9px] font-mono font-bold text-zinc-300 tracking-wider mb-2">
            CH 2 (DECK B)
          </span>

          {/* Gain Trim */}
          <RotaryKnob
            label="TRIM"
            value={deckB.gain}
            min={0}
            max={2.0}
            defaultValue={1.0}
            step={0.05}
            color="#ffffff"
            size={38}
            onChange={onSetGainB}
          />

          <div className="w-full h-px bg-[#18181b] my-1.5" />

          {/* High EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="HI EQ"
              value={deckB.eqHigh}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQHighB}
            />
            <button
              onClick={() => onToggleKillB('high')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckB.killHigh
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL HI
            </button>
          </div>

          {/* Mid EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="MID EQ"
              value={deckB.eqMid}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQMidB}
            />
            <button
              onClick={() => onToggleKillB('mid')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckB.killMid
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL MID
            </button>
          </div>

          {/* Low EQ + Kill */}
          <div className="flex flex-col items-center my-0.5">
            <RotaryKnob
              label="LOW EQ"
              value={deckB.eqLow}
              min={-24}
              max={6}
              defaultValue={0}
              unit="dB"
              color="#ffffff"
              size={38}
              centerDetent
              onChange={onSetEQLowB}
            />
            <button
              onClick={() => onToggleKillB('low')}
              className={`mt-1 px-1.5 py-0.2 rounded-3xl text-[7px] font-mono font-bold border transition-all ${
                deckB.killLow
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              KILL BASS
            </button>
          </div>

          <div className="w-full h-px bg-[#18181b] my-1.5" />

          {/* Bi-directional HPF/LPF Filter */}
          <div className="my-0.5">
            <RotaryKnob
              label="FILTER (HPF/LPF)"
              value={deckB.filter}
              min={-1}
              max={1}
              defaultValue={0}
              color="#ffffff"
              size={40}
              centerDetent
              onChange={onSetFilterB}
            />
          </div>

          {/* Channel Fader & VU Meter */}
          <div className="flex items-center gap-2 mt-2 w-full justify-center">
            <VUMeter analyser={analyserB} height={100} label="CH 2" />
            <div className="relative h-32 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={deckB.volume}
                onChange={(e) => onSetVolumeB(parseFloat(e.target.value))}
                className="-rotate-90 w-28 cursor-pointer bg-transparent"
                title="Deck B Volume"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PRO CROSSFADER STRIP */}
      <div className="flex flex-col items-center bg-[#050505] p-2.5 rounded-3xl border border-[#1c1c1f] mt-2.5">
        <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold px-2 mb-1">
          <span className="text-zinc-300">DECK A</span>
          <span className="text-zinc-500 text-[8px]">CROSSFADER (KEYS: X / C / V)</span>
          <span className="text-zinc-300">DECK B</span>
        </div>

        {/* Crossfader Rail */}
        <div className="relative w-full max-w-md flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={crossfader}
            onChange={(e) => onSetCrossfader(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#000000] rounded-3xl cursor-pointer border border-[#27272a]"
            title="Crossfader"
          />
        </div>

        {/* Quick Snap Buttons */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => onSetCrossfader(0)}
            className="px-2 py-0.5 rounded-3xl text-[8px] font-mono font-bold bg-[#0d0d0d] text-zinc-300 hover:text-white border border-zinc-800 active:scale-95"
          >
            [X] DECK A
          </button>
          <button
            onClick={() => onSetCrossfader(0.5)}
            className="px-2 py-0.5 rounded-3xl text-[8px] font-mono font-bold bg-[#0d0d0d] text-zinc-400 hover:text-white border border-zinc-800 active:scale-95"
          >
            [C] CENTER
          </button>
          <button
            onClick={() => onSetCrossfader(1)}
            className="px-2 py-0.5 rounded-3xl text-[8px] font-mono font-bold bg-[#0d0d0d] text-zinc-300 hover:text-white border border-zinc-800 active:scale-95"
          >
            [V] DECK B
          </button>
        </div>
      </div>
    </div>
  );
};

export const CentralMixer = memo(CentralMixerComponent);
