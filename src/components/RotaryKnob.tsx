'use client';

import React, { useState, useRef, useEffect, memo } from 'react';

interface RotaryKnobProps {
  value: number; // current value
  min: number;
  max: number;
  defaultValue?: number;
  step?: number;
  label: string;
  unit?: string;
  color?: string; // arc / accent color
  size?: number; // px diameter
  onChange: (value: number) => void;
  centerDetent?: boolean;
}

const RotaryKnobComponent: React.FC<RotaryKnobProps> = ({
  value,
  min,
  max,
  defaultValue = 0,
  step = 0.01,
  label,
  unit = '',
  color = '#ffffff',
  size = 50,
  onChange,
  centerDetent = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);

  // Convert value to rotation angle (-135deg to +135deg = 270deg total sweep)
  const normalized = (value - min) / (max - min);
  const angle = -135 + normalized * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartValue.current = value;
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 180;
      let newValue = dragStartValue.current + deltaY * sensitivity;

      if (centerDetent && Math.abs(newValue - defaultValue) < range * 0.04) {
        newValue = defaultValue;
      }

      newValue = Math.max(min, Math.min(max, newValue));
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.touches[0].clientY;
      const range = max - min;
      const sensitivity = range / 180;
      let newValue = dragStartValue.current + deltaY * sensitivity;

      if (centerDetent && Math.abs(newValue - defaultValue) < range * 0.04) {
        newValue = defaultValue;
      }

      newValue = Math.max(min, Math.min(max, newValue));
      onChange(newValue);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange, centerDetent, defaultValue]);

  const displayVal = Number.isInteger(value) ? value : value.toFixed(1);

  return (
    <div className="flex flex-col items-center select-none group cursor-pointer" onDoubleClick={handleDoubleClick}>
      <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider mb-1 uppercase group-hover:text-zinc-200">
        {label}
      </span>

      <div
        className={`relative flex items-center justify-center rounded-full bg-[#0a0a0a] border transition-all duration-150 ${
          isDragging ? 'border-zinc-500 ring-1 ring-white/30' : 'border-[#27272a] hover:border-zinc-500'
        }`}
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Arc Background Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1c1c1f"
            strokeWidth="7"
            strokeDasharray="188 300"
            strokeDashoffset="-28"
            strokeLinecap="round"
          />
          {/* Active Arc (Clean flat line, no neon glow) */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color === '#00f2ff' || color === '#ff7700' ? '#ffffff' : color}
            strokeWidth="7"
            strokeDasharray={`${normalized * 188} 300`}
            strokeDashoffset="-28"
            strokeLinecap="round"
            style={{
              transition: isDragging ? 'none' : 'stroke-dasharray 0.05s ease',
            }}
          />
        </svg>

        {/* Inner Knob Dial */}
        <div
          className="w-3/4 h-3/4 rounded-full bg-gradient-to-b from-[#1c1c1f] to-[#0d0d0d] border border-[#2e2e33] flex items-center justify-center relative shadow-inner"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.05s ease',
          }}
        >
          {/* Top Pointer Tick (Clean crisp White) */}
          <div className="w-1 h-2.5 rounded-full absolute -top-0.5 bg-white" />
          {/* Center Cap */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#080808] border border-[#27272a]" />
        </div>
      </div>

      <div className="text-[9px] font-mono text-zinc-300 mt-1 font-semibold">
        {displayVal}{unit}
      </div>
    </div>
  );
};

export const RotaryKnob = memo(RotaryKnobComponent);
