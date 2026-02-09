'use client';

import React, { useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';

interface XYPadProps {
  label: string;
  xParamName: string;
  yParamName: string;
  onXYChange: (x: number, y: number) => void;
  onXYRelease?: () => void;
  color?: string;
}

export const XYPad: React.FC<XYPadProps> = ({
  label,
  xParamName,
  yParamName,
  onXYChange,
  onXYRelease,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [posX, setPosX] = useState(0.5);
  const [posY, setPosY] = useState(0.5);
  const [isHolding, setIsHolding] = useState(false);

  const updateCoordinates = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

    setPosX(x);
    setPosY(y);
    onXYChange(x, y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsHolding(true);
    updateCoordinates(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHolding) return;
    updateCoordinates(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isHolding) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
      setIsHolding(false);
      if (onXYRelease) onXYRelease();
    }
  };

  return (
    <div className="flex flex-col bg-[#050505] border border-[#1c1c1f] rounded-3xl p-2">
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#18181b]">
        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-zinc-400" />
          {label}
        </span>
        <span className="text-[7px] font-mono text-zinc-500">
          X: {xParamName} / Y: {yParamName}
        </span>
      </div>

      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-28 rounded-3xl bg-[#000000] border border-[#1f1f23] cursor-crosshair overflow-hidden touch-none select-none"
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border-r border-b border-zinc-800" />
          ))}
        </div>

        {/* Crosshair Center Pointer (Clean Solid White) */}
        <div
          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900 pointer-events-none transition-all duration-75 bg-white shadow-md"
          style={{
            left: `${posX * 100}%`,
            top: `${(1 - posY) * 100}%`,
            transform: isHolding ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(1)',
          }}
        />

        {/* Coordinate HUD */}
        <div className="absolute bottom-1 right-1.5 px-1 py-0.2 rounded-3xl bg-[#0a0a0a]/90 text-[7px] font-mono text-zinc-400 pointer-events-none border border-zinc-800">
          X: {Math.round(posX * 100)}% | Y: {Math.round(posY * 100)}%
        </div>
      </div>
    </div>
  );
};
