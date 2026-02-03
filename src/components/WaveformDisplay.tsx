'use client';

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { DeckState } from '../lib/types/dj';
import { ZoomIn, ZoomOut, Compass, Palette, Sparkles, Layers } from 'lucide-react';

export type WaveformColorMode = 'rgb' | 'oled' | 'solar';

interface WaveformDisplayProps {
  deckA: DeckState;
  deckB: DeckState;
  onSeekA: (time: number) => void;
  onSeekB: (time: number) => void;
  onClose?: () => void;
}

const WaveformDisplayComponent: React.FC<WaveformDisplayProps> = ({
  deckA,
  deckB,
  onSeekA,
  onSeekB,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overviewARef = useRef<HTMLCanvasElement>(null);
  const overviewBRef = useRef<HTMLCanvasElement>(null);

  const [zoomBars, setZoomBars] = useState<number>(4);
  const [phaseOffset, setPhaseOffset] = useState<number>(0);
  const [colorMode, setColorMode] = useState<WaveformColorMode>('rgb');

  // Ref-based state caching for 60 FPS animation loop (zero React re-render lag)
  const deckARef = useRef(deckA);
  const deckBRef = useRef(deckB);
  const zoomBarsRef = useRef(zoomBars);
  const colorModeRef = useRef(colorMode);

  useEffect(() => {
    deckARef.current = deckA;
    deckBRef.current = deckB;
    zoomBarsRef.current = zoomBars;
    colorModeRef.current = colorMode;
  });

  // Smooth continuous 60 FPS Canvas rendering loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentDeckA = deckARef.current;
      const currentDeckB = deckBRef.current;
      const currentZoom = zoomBarsRef.current;
      const currentMode = colorModeRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Pure OLED Pitch Black Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Center subtle separator line
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Render Deck A (Top Half: 0 to midY)
      renderScrollingDeckWaveform(
        ctx,
        currentDeckA,
        0,
        0,
        width,
        midY,
        currentZoom,
        currentMode
      );

      // Render Deck B (Bottom Half: midY to height)
      renderScrollingDeckWaveform(
        ctx,
        currentDeckB,
        0,
        midY,
        width,
        midY,
        currentZoom,
        currentMode
      );

      // Center Playhead Line (Solid crisp white)
      const playheadX = width / 2;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead Haze (Subtle LCD bleed)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead Top & Bottom Arrow Markers
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 6);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(playheadX - 5, height);
      ctx.lineTo(playheadX + 5, height);
      ctx.lineTo(playheadX, height - 6);
      ctx.fill();
      ctx.restore();

      // Calculate phase difference between Deck A & Deck B
      if (currentDeckA.track && currentDeckB.track && currentDeckA.isPlaying && currentDeckB.isPlaying) {
        const bpmA = currentDeckA.track.bpm * currentDeckA.playbackRate;
        const beatSecA = 60 / bpmA;
        const phaseA = (currentDeckA.currentTime % beatSecA) / beatSecA;

        const bpmB = currentDeckB.track.bpm * currentDeckB.playbackRate;
        const beatSecB = 60 / bpmB;
        const phaseB = (currentDeckB.currentTime % beatSecB) / beatSecB;

        let diff = phaseB - phaseA;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;
        setPhaseOffset(diff);
      } else {
        setPhaseOffset(0);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Render individual deck scrolling RGB frequency waveform
  const renderScrollingDeckWaveform = (
    ctx: CanvasRenderingContext2D,
    deck: DeckState,
    x: number,
    y: number,
    w: number,
    h: number,
    visibleBars: number,
    mode: WaveformColorMode
  ) => {
    if (!deck.track || !deck.track.waveformData) {
      ctx.fillStyle = '#52525b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`DECK ${deck.deckId}: NO TRACK LOADED`, x + w / 2, y + h / 2 + 4);
      return;
    }

    const { peaks, bassPeaks, midPeaks, highPeaks, duration } = deck.track.waveformData;
    const effectiveBPM = deck.track.bpm * deck.playbackRate;
    const secondsPerBar = (60 / (effectiveBPM || 128)) * 4;
    const windowSeconds = secondsPerBar * visibleBars;

    const playheadX = x + w / 2;
    const startTime = deck.currentTime - windowSeconds / 2;
    const endTime = deck.currentTime + windowSeconds / 2;

    const centerY = y + h / 2;
    const maxAmplitude = (h / 2) * 0.88;

    // 1. Draw Beat Grid & Downbeat Lines
    const beatInterval = 60 / (effectiveBPM || 128);
    const firstBeat = Math.floor(startTime / beatInterval) * beatInterval;

    for (let t = firstBeat; t <= endTime; t += beatInterval) {
      if (t < 0 || t > duration) continue;
      const beatX = playheadX + ((t - deck.currentTime) / windowSeconds) * w;
      const beatIndex = Math.round(t / beatInterval);
      const isDownbeat = beatIndex % 4 === 0;

      ctx.save();
      if (isDownbeat) {
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.85;
      } else {
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
      }

      ctx.beginPath();
      ctx.moveTo(beatX, y + 2);
      ctx.lineTo(beatX, y + h - 2);
      ctx.stroke();

      if (isDownbeat) {
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        const barNumber = Math.floor(beatIndex / 4) + 1;
        ctx.fillText(`${barNumber}`, beatX, y + (deck.deckId === 'A' ? 11 : h - 4));
      }
      ctx.restore();
    }

    // 2. Draw Active Loop Region
    if (deck.loop.active && deck.loop.end > deck.loop.start) {
      const loopStartX = playheadX + ((deck.loop.start - deck.currentTime) / windowSeconds) * w;
      const loopEndX = playheadX + ((deck.loop.end - deck.currentTime) / windowSeconds) * w;

      ctx.save();
      ctx.fillStyle = mode === 'rgb' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(loopStartX, y, loopEndX - loopStartX, h);
      ctx.strokeStyle = mode === 'rgb' ? '#06b6d4' : '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(loopStartX, y, loopEndX - loopStartX, h);

      ctx.fillStyle = mode === 'rgb' ? '#38bdf8' : '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('IN', loopStartX + 4, y + 11);
      ctx.fillText('OUT', loopEndX - 20, y + 11);
      ctx.restore();
    }

    // 3. Draw RGB 3-Band or Monochrome Waveform Bars
    const totalPoints = peaks.length;
    const pixelsPerStep = 2.5;
    const steps = Math.ceil(w / pixelsPerStep);

    for (let i = 0; i < steps; i++) {
      const screenX = x + i * pixelsPerStep;
      const timeAtX = deck.currentTime + ((screenX - playheadX) / w) * windowSeconds;

      if (timeAtX < 0 || timeAtX > duration) continue;

      const peakIndex = Math.floor((timeAtX / duration) * totalPoints);
      if (peakIndex < 0 || peakIndex >= totalPoints) continue;

      const peak = peaks[peakIndex];
      const bass = bassPeaks ? bassPeaks[peakIndex] || 0 : 0;
      const mid = midPeaks ? midPeaks[peakIndex] || 0 : 0;
      const high = highPeaks ? highPeaks[peakIndex] || 0 : 0;

      const barHeight = peak * maxAmplitude;

      if (mode === 'rgb') {
        // Dynamic 3-Band Frequency Spectrum Gradient:
        // Top & Bottom Tips: High frequency Cyan (#06b6d4 / #38bdf8)
        // Mid body: Vocal / Melody Emerald (#10b981 / #34d399)
        // Core center: Deep Bass & Kicks Crimson/Rose (#f43f5e / #ef4444)
        const grad = ctx.createLinearGradient(screenX, centerY - barHeight, screenX, centerY + barHeight);

        const r = Math.min(255, Math.floor(bass * 255 * 1.5 + 30));
        const g = Math.min(255, Math.floor(mid * 230 * 1.4 + 20));
        const b = Math.min(255, Math.floor(high * 255 * 1.8 + 40));

        grad.addColorStop(0, `rgba(6, 182, 212, ${0.4 + high * 0.55})`); // Cyan highs
        grad.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, ${0.7 + mid * 0.3})`);
        grad.addColorStop(0.5, `rgba(244, 63, 94, ${0.85 + bass * 0.15})`); // Red bass core
        grad.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${0.7 + mid * 0.3})`);
        grad.addColorStop(1, `rgba(6, 182, 212, ${0.4 + high * 0.55})`);

        ctx.fillStyle = grad;
        ctx.fillRect(screenX, centerY - barHeight, pixelsPerStep - 0.5, barHeight * 2);
      } else if (mode === 'solar') {
        // Solar Heatmap: Amber -> Gold -> Crimson
        const grad = ctx.createLinearGradient(screenX, centerY - barHeight, screenX, centerY + barHeight);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.95)'); // Amber 400
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.85)'); // Amber 500
        grad.addColorStop(1, 'rgba(180, 83, 9, 0.5)'); // Amber 700

        ctx.fillStyle = grad;
        ctx.fillRect(screenX, centerY - barHeight, pixelsPerStep - 0.5, barHeight * 2);
      } else {
        // OLED Monochrome Stealth
        const grad = ctx.createLinearGradient(screenX, centerY - barHeight, screenX, centerY + barHeight);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.5, 'rgba(161, 161, 170, 0.8)');
        grad.addColorStop(1, 'rgba(63, 63, 70, 0.4)');

        ctx.fillStyle = grad;
        ctx.fillRect(screenX, centerY - barHeight, pixelsPerStep - 0.5, barHeight * 2);
      }
    }

    // 4. Draw Hot Cue Markers
    deck.hotCues.forEach((cue, idx) => {
      if (!cue) return;
      const cueX = playheadX + ((cue.position - deck.currentTime) / windowSeconds) * w;
      if (cueX >= x && cueX <= x + w) {
        ctx.save();
        ctx.fillStyle = cue.color || '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cueX, centerY - maxAmplitude - 4);
        ctx.lineTo(cueX + 8, centerY - maxAmplitude - 12);
        ctx.lineTo(cueX - 8, centerY - maxAmplitude - 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${idx + 1}`, cueX, centerY - maxAmplitude - 14);

        ctx.strokeStyle = cue.color || '#ffffff';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(cueX, y);
        ctx.lineTo(cueX, y + h);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Deck Badge Overlay
    ctx.fillStyle = mode === 'rgb' ? '#a1a1aa' : '#71717a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DECK ${deck.deckId}`, x + 8, y + 14);
  };

  // Full-track overview rendering with 3-Band Color preview
  useEffect(() => {
    renderTrackOverview(overviewARef.current, deckA, colorMode, onSeekA);
    renderTrackOverview(overviewBRef.current, deckB, colorMode, onSeekB);
  }, [deckA.track, deckA.currentTime, deckB.track, deckB.currentTime, colorMode, onSeekA, onSeekB]);

  const renderTrackOverview = (
    canvas: HTMLCanvasElement | null,
    deck: DeckState,
    mode: WaveformColorMode,
    onSeek: (t: number) => void
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    if (!deck.track || !deck.track.waveformData) {
      return;
    }

    const { peaks, bassPeaks, midPeaks, highPeaks, duration } = deck.track.waveformData;
    const totalPoints = peaks.length;
    const centerY = h / 2;

    for (let i = 0; i < w; i++) {
      const idx = Math.floor((i / w) * totalPoints);
      const val = peaks[idx] || 0;
      const barH = val * (h / 2) * 0.9;

      if (mode === 'rgb' && bassPeaks && midPeaks && highPeaks) {
        const bass = bassPeaks[idx] || 0;
        const mid = midPeaks[idx] || 0;
        const high = highPeaks[idx] || 0;

        const r = Math.min(255, Math.floor(bass * 255 * 1.5 + 40));
        const g = Math.min(255, Math.floor(mid * 220 * 1.3 + 30));
        const b = Math.min(255, Math.floor(high * 255 * 1.7 + 50));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      } else if (mode === 'solar') {
        ctx.fillStyle = 'rgb(245, 158, 11)';
      } else {
        ctx.fillStyle = '#3f3f46';
      }

      ctx.fillRect(i, centerY - barH, 1, barH * 2);
    }

    // Playhead line
    const playheadX = (deck.currentTime / duration) * w;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playheadX - 0.5, 0, 1.5, h);

    // Elapsed progress tint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, playheadX, h);
  };

  const handleOverviewClick = (e: React.MouseEvent<HTMLCanvasElement>, deck: DeckState, onSeek: (t: number) => void) => {
    if (!deck.track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const targetTime = clickRatio * deck.track.duration;
    onSeek(targetTime);
  };

  const handleWheelZoom = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomBars(prev => Math.max(1, prev / 2));
    } else {
      setZoomBars(prev => Math.min(16, prev * 2));
    }
  }, []);

  return (
    <div className="flex flex-col bg-[#000000] border border-[#222222] rounded-3xl p-3 select-none relative group">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-[#111111] border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors z-10 hidden sm:flex opacity-0 group-hover:opacity-100"
          title="Close Waveform"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}

      {/* Top Header / Phase Meter, Color Mode Switcher & Zoom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-[#18181b] text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            Phase Alignment Meter
          </span>

          {/* Color Mode Switcher */}
          <div className="flex items-center bg-[#0a0a0a] p-0.5 rounded-3xl border border-[#1f1f23] ml-2">
            <button
              onClick={() => setColorMode('rgb')}
              className={`px-2 py-0.5 rounded-3xl text-[9px] font-mono font-bold flex items-center gap-1 transition-all ${
                colorMode === 'rgb'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="3-Band RGB Frequency Waveforms (Cyan Highs, Emerald Mids, Red Bass)"
            >
              <Palette className="w-2.5 h-2.5" />
              <span>RGB 3-BAND</span>
            </button>
            <button
              onClick={() => setColorMode('oled')}
              className={`px-2 py-0.5 rounded-3xl text-[9px] font-mono font-bold transition-all ${
                colorMode === 'oled'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Monochrome OLED Stealth"
            >
              <span>MONO</span>
            </button>
            <button
              onClick={() => setColorMode('solar')}
              className={`px-2 py-0.5 rounded-3xl text-[9px] font-mono font-bold transition-all ${
                colorMode === 'solar'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Solar Heatmap"
            >
              <span>SOLAR</span>
            </button>
          </div>
        </div>

        {/* Phase Alignment Visual Bar */}
        <div className="flex items-center gap-1.5 w-48 sm:w-60 bg-[#0a0a0a] px-2 py-1 rounded-3xl border border-[#1f1f23]">
          <span className="text-[8px] font-mono font-bold text-zinc-400">DECK A</span>
          <div className="relative flex-1 h-2.5 bg-[#000000] rounded-3xl overflow-hidden border border-zinc-900">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-zinc-600 z-10" />
            <div
              className={`absolute top-0 bottom-0 w-2 rounded-xs transition-all duration-75 ${
                colorMode === 'rgb' ? 'bg-cyan-400 shadow-sm' : 'bg-white'
              }`}
              style={{
                left: `calc(50% + ${phaseOffset * 90}% - 4px)`,
              }}
            />
          </div>
          <span className="text-[8px] font-mono font-bold text-zinc-400">DECK B</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded-3xl border border-[#1f1f23]">
          <button
            onClick={() => setZoomBars(prev => Math.min(16, prev * 2))}
            className="p-1 text-zinc-400 hover:text-white rounded-3xl hover:bg-[#18181b] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[9px] font-mono font-bold text-zinc-300 px-1">{zoomBars} Bars</span>
          <button
            onClick={() => setZoomBars(prev => Math.max(1, prev / 2))}
            className="p-1 text-zinc-400 hover:text-white rounded-3xl hover:bg-[#18181b] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Dual Scrolling 60FPS Waveform Canvas with Mousewheel Zoom */}
      <div
        className="relative w-full my-2 rounded-3xl overflow-hidden border border-[#18181b] bg-[#000000]"
        onWheel={handleWheelZoom}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={160}
          className="w-full h-36 sm:h-44 block cursor-ew-resize"
        />
      </div>

      {/* Mini Full-Track Overview Strips with Frequency Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {/* Deck A Overview */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span className="text-zinc-300 font-bold">DECK A OVERVIEW</span>
            <span>{deckA.track ? `${Math.floor(deckA.currentTime)}s / ${Math.floor(deckA.duration)}s` : '--:--'}</span>
          </div>
          <canvas
            ref={overviewARef}
            width={600}
            height={24}
            className="w-full h-5 rounded-3xl bg-[#050505] border border-[#18181b] cursor-pointer hover:border-zinc-500 transition-colors"
            onClick={(e) => handleOverviewClick(e, deckA, onSeekA)}
            title="Click to scrub Deck A"
          />
        </div>

        {/* Deck B Overview */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span className="text-zinc-300 font-bold">DECK B OVERVIEW</span>
            <span>{deckB.track ? `${Math.floor(deckB.currentTime)}s / ${Math.floor(deckB.duration)}s` : '--:--'}</span>
          </div>
          <canvas
            ref={overviewBRef}
            width={600}
            height={24}
            className="w-full h-5 rounded-3xl bg-[#050505] border border-[#18181b] cursor-pointer hover:border-zinc-500 transition-colors"
            onClick={(e) => handleOverviewClick(e, deckB, onSeekB)}
            title="Click to scrub Deck B"
          />
        </div>
      </div>
    </div>
  );
};

export const WaveformDisplay = memo(WaveformDisplayComponent);

