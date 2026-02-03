'use client';

import React, { useEffect, useRef, memo } from 'react';

interface VUMeterProps {
  analyser?: AnalyserNode;
  height?: number;
  segments?: number;
  label?: string;
  isActive?: boolean;
}

const VUMeterComponent: React.FC<VUMeterProps> = ({
  analyser,
  height = 100,
  segments = 14,
  label,
  isActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArray = useRef(new Uint8Array(128));
  const peakLRef = useRef(0);
  const peakRRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let reqId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear Canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      if (!analyser || !isActive) {
        // Draw unlit background segments
        drawSegments(ctx, 0, 0, w, h, segments);
        return;
      }

      analyser.getByteTimeDomainData(dataArray.current);

      let sumL = 0;
      let sumR = 0;
      const len = dataArray.current.length;
      for (let i = 0; i < len; i++) {
        const val = (dataArray.current[i] - 128) / 128;
        if (i % 2 === 0) sumL += val * val;
        else sumR += val * val;
      }

      const rmsL = Math.sqrt(sumL / (len / 2)) * 2.8;
      const rmsR = Math.sqrt(sumR / (len / 2)) * 2.8;

      const normL = Math.min(1, Math.max(0, rmsL));
      const normR = Math.min(1, Math.max(0, rmsR));

      peakLRef.current = Math.max(normL, peakLRef.current * 0.94);
      peakRRef.current = Math.max(normR, peakRRef.current * 0.94);

      drawSegments(ctx, normL, normR, w, h, segments, peakLRef.current, peakRRef.current);

      reqId = requestAnimationFrame(render);
    };

    reqId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(reqId);
  }, [analyser, isActive, height, segments]);

  const drawSegments = (
    ctx: CanvasRenderingContext2D,
    levelL: number,
    levelR: number,
    w: number,
    h: number,
    numSegments: number,
    peakL: number = 0,
    peakR: number = 0
  ) => {
    const channelWidth = (w - 4) / 2;
    const segHeight = (h - (numSegments - 1) * 2) / numSegments;

    const litL = Math.round(levelL * numSegments);
    const litR = Math.round(levelR * numSegments);
    const peakSegL = Math.round(peakL * numSegments);
    const peakSegR = Math.round(peakR * numSegments);

    for (let i = 0; i < numSegments; i++) {
      const y = h - (i + 1) * (segHeight + 2);

      let color = '#d4d4d8';
      let unlitColor = 'rgba(39, 39, 42, 0.4)';
      if (i >= numSegments - 2) {
        color = '#ef4444'; // Red peak
      } else if (i >= numSegments - 5) {
        color = '#f59e0b'; // Amber warning
      }

      // Left channel
      const isLitL = i < litL || (i === peakSegL - 1 && peakSegL > 0);
      ctx.fillStyle = isLitL ? color : unlitColor;
      ctx.fillRect(1, y, channelWidth, segHeight);

      // Right channel
      const isLitR = i < litR || (i === peakSegR - 1 && peakSegR > 0);
      ctx.fillStyle = isLitR ? color : unlitColor;
      ctx.fillRect(channelWidth + 3, y, channelWidth, segHeight);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[8px] font-mono font-bold text-zinc-500">{label}</span>}
      <div className="bg-[#0a0a0a] p-1 rounded-3xl border border-[#1f1f23] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={18}
          height={height}
          className="block rounded-xs"
        />
      </div>
    </div>
  );
};

export const VUMeter = memo(VUMeterComponent);

