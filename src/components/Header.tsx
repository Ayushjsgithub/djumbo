'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { Circle, Keyboard, BookOpen, Usb, Maximize2, Sparkles, GraduationCap, Sliders, Layout, Check } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';

export type ViewMode = 'simple' | 'academy' | 'pro';

interface HeaderProps {
  masterVolume: number;
  onSetMasterVolume: (val: number) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  midiDevices: string[];
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onOpenGuide: () => void;
  onOpenShortcuts: () => void;
  layoutOptions?: {
    showWaveform: boolean;
    setShowWaveform: (b: boolean) => void;
    showPhraseBar: boolean;
    setShowPhraseBar: (b: boolean) => void;
    showFXRackA: boolean;
    setShowFXRackA: (b: boolean) => void;
    showFXRackB: boolean;
    setShowFXRackB: (b: boolean) => void;
    showSoundboard: boolean;
    setShowSoundboard: (b: boolean) => void;
    showTrackLibrary: boolean;
    setShowTrackLibrary: (b: boolean) => void;
  };
}

const HeaderComponent: React.FC<HeaderProps> = ({
  masterVolume,
  onSetMasterVolume,
  isRecording,
  onToggleRecord,
  midiDevices,
  viewMode,
  onSetViewMode,
  onOpenGuide,
  onOpenShortcuts,
  layoutOptions,
}) => {
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
    };
    if (isLayoutMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayoutMenuOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordSeconds(0);
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#000000] border-b border-[#222222] px-4 py-2.5">
      {/* Brand & Guide */}
      <div className="flex flex-col items-center md:items-start gap-1">
        <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white select-none leading-none">
          djumbo
        </h1>

        {/* Prominent HOW TO DJ Guide Button */}
        <button
          onClick={onOpenGuide}
          className="px-2.5 py-1 rounded-3xl bg-[#111111] hover:bg-white hover:text-black border border-zinc-700 text-zinc-200 text-[10px] sm:text-xs font-mono font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>HOW TO DJ (GUIDE)</span>
        </button>
      </div>

      {/* Mode Switcher Tabs (Segmented Control) */}
      <div className="relative flex items-center bg-[#0a0a0a] p-1 rounded-3xl border border-[#27272a] shadow-inner">
        {/* Sliding Pill Background */}
        <div
          className="absolute top-1 bottom-1 w-[100px] sm:w-[110px] bg-white rounded-3xl shadow-md transition-transform duration-200 ease-in-out pointer-events-none z-0"
          style={{
            transform: `translateX(${
              viewMode === 'simple' ? 0 : viewMode === 'academy' ? 100 : 200
            }%)`,
          }}
        />

        <button
          onClick={() => onSetViewMode('simple')}
          className={`relative z-10 w-[100px] sm:w-[110px] px-2 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
            viewMode === 'simple' ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Easy, intuitive beginner view with zero confusion"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>EASY DJ</span>
        </button>

        <button
          onClick={() => onSetViewMode('academy')}
          className={`relative z-10 w-[100px] sm:w-[110px] px-2 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
            viewMode === 'academy' ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Step-by-step interactive DJ lessons & missions"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>ACADEMY</span>
        </button>

        <button
          onClick={() => onSetViewMode('pro')}
          className={`relative z-10 w-[100px] sm:w-[110px] px-2 sm:px-3 py-1.5 flex items-center justify-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
            viewMode === 'pro' ? 'text-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Full Dual Deck Pro Console with all knobs & FX"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>PRO MIXER</span>
        </button>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Master Volume */}
        <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-3xl border border-zinc-800">
          <RotaryKnob
            label="VOL"
            value={masterVolume}
            min={0}
            max={1.5}
            defaultValue={0.9}
            step={0.02}
            color="#ffffff"
            size={30}
            onChange={onSetMasterVolume}
          />
        </div>

        {/* Live Mix Recorder */}
        <button
          onClick={onToggleRecord}
          className={`px-3 py-1.5 rounded-3xl flex items-center gap-1.5 font-mono font-bold text-xs border transition-all active:scale-95 ${
            isRecording
              ? 'bg-red-950/90 border-red-500 text-red-200'
              : 'bg-[#0d0d0d] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
          }`}
          title={isRecording ? 'Click to Stop & Save Mix' : 'Record Live DJ Mix to Audio File'}
        >
          <Circle className={`w-3 h-3 fill-current ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
          <span>{isRecording ? `REC [${formatRecTime(recordSeconds)}]` : 'REC'}</span>
        </button>

        {/* Web MIDI Badge */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-3xl text-[9px] font-mono font-bold border ${
            midiDevices.length > 0
              ? 'bg-[#0d160f] border-emerald-700 text-emerald-300'
              : 'bg-[#0a0a0a] border-zinc-800 text-zinc-500'
          }`}
          title={midiDevices.length > 0 ? `Connected: ${midiDevices.join(', ')}` : 'USB MIDI Ready'}
        >
          <Usb className="w-3 h-3" />
          <span>{midiDevices.length > 0 ? 'MIDI ON' : 'MIDI'}</span>
        </div>

        {/* Shortcuts Helper */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-3xl bg-[#0d0d0d] hover:bg-[#1a1a1a] text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-3xl bg-[#0d0d0d] hover:bg-[#1a1a1a] text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Layout Options Dropdown */}
        {layoutOptions && (
          <div className="relative" ref={layoutMenuRef}>
            <button
              onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
              className={`p-2 rounded-3xl border transition-colors ${
                isLayoutMenuOpen 
                  ? 'bg-white text-black border-white' 
                  : 'bg-[#0d0d0d] hover:bg-[#1a1a1a] text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title="Toggle UI Modules"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>

            {isLayoutMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#000000] border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1">
                <div className="px-2 py-1 text-[9px] font-mono font-bold text-zinc-500 uppercase border-b border-zinc-900 mb-1">
                  VISIBLE MODULES
                </div>
                {[
                  { label: 'Master Waveform', state: layoutOptions.showWaveform, toggle: layoutOptions.setShowWaveform },
                  { label: 'Phrase Tracker', state: layoutOptions.showPhraseBar, toggle: layoutOptions.setShowPhraseBar },
                  { label: 'Deck A FX Rack', state: layoutOptions.showFXRackA, toggle: layoutOptions.setShowFXRackA },
                  { label: 'Deck B FX Rack', state: layoutOptions.showFXRackB, toggle: layoutOptions.setShowFXRackB },
                  { label: 'DJ Soundboard', state: layoutOptions.showSoundboard, toggle: layoutOptions.setShowSoundboard },
                  { label: 'Track Library', state: layoutOptions.showTrackLibrary, toggle: layoutOptions.setShowTrackLibrary },
                ].map((mod, idx) => (
                  <button
                    key={idx}
                    onClick={() => mod.toggle(!mod.state)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors text-left w-full"
                  >
                    <span className="text-[10px] font-mono text-zinc-300">{mod.label}</span>
                    {mod.state ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
