'use client';

import React, { useRef, useState, useEffect, memo } from 'react';
import { Disc3 } from 'lucide-react';

interface VinylJogWheelProps {
  deckId: 'A' | 'B';
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  color?: string;
  onScratchStart: () => void;
  onScratchMove: (deltaRot: number) => void;
  onScratchEnd: () => void;
  onPitchBend: (direction: number) => void;
  trackTitle?: string;
}

const VinylJogWheelComponent: React.FC<VinylJogWheelProps> = ({
  deckId,
  isPlaying,
  currentTime,
  duration,
  onScratchStart,
  onScratchMove,
  onScratchEnd,
  onPitchBend,
  trackTitle,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const platterRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<number>(0);
  const [isScratching, setIsScratching] = useState(false);
  const isScratchingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  const lastAngleRef = useRef<number>(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isScratchingRef.current = isScratching;
  }, [isScratching]);

  // Rotate platter smoothly via direct DOM style transform (0 React state re-renders per frame)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlayingRef.current && !isScratchingRef.current) {
        rotationRef.current = (rotationRef.current + delta * 200) % 360;
        if (platterRef.current) {
          platterRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Calculate pointer angle relative to center of wheel
  const getAngle = (clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return (rad * 180) / Math.PI;
  };

  const handlePointerDownCenter = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsScratching(true);
    isScratchingRef.current = true;
    onScratchStart();
    const startAngle = getAngle(e.clientX, e.clientY);
    lastAngleRef.current = startAngle;
  };

  const handlePointerMoveCenter = (e: React.PointerEvent) => {
    if (!isScratchingRef.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    let delta = currentAngle - lastAngleRef.current;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    lastAngleRef.current = currentAngle;
    rotationRef.current = (rotationRef.current + delta) % 360;

    if (platterRef.current) {
      platterRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
    }

    const deltaNormalized = delta / 360;
    onScratchMove(deltaNormalized);
  };

  const handlePointerUpCenter = (e: React.PointerEvent) => {
    if (isScratchingRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsScratching(false);
      isScratchingRef.current = false;
      onScratchEnd();
    }
  };

  const handleNudgeForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPitchBend(1);
    setTimeout(() => onPitchBend(0), 120);
  };

  const handleNudgeBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPitchBend(-1);
    setTimeout(() => onPitchBend(0), 120);
  };

  return (
    <div className="relative flex items-center justify-center p-2 select-none">
      {/* Outer Matte Platter (Pitch Bend / Nudge Zone) */}
      <div
        ref={wheelRef}
        className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-[#0d0d0f] border-2 border-[#27272a] flex items-center justify-center cursor-grab active:cursor-grabbing group shadow-xl"
      >
        {/* Nudge Helper Buttons along sides */}
        <button
          onClick={handleNudgeBackward}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-5 h-9 rounded-l bg-[#18181b] hover:bg-[#27272a] text-zinc-400 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center border-l border-y border-zinc-700 active:scale-95"
          title="Nudge Slow (-)"
        >
          -
        </button>
        <button
          onClick={handleNudgeForward}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-5 h-9 rounded-r bg-[#18181b] hover:bg-[#27272a] text-zinc-400 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center border-r border-y border-zinc-700 active:scale-95"
          title="Nudge Fast (+)"
        >
          +
        </button>

        {/* Vinyl Platter (Scratch Zone) */}
        <div
          className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-[#1f1f23] flex items-center justify-center touch-none overflow-hidden"
          style={{
            background: 'repeating-radial-gradient(circle, #0a0a0a 0px, #0a0a0a 3px, #111111 3.5px, #0a0a0a 4px)',
          }}
          onPointerDown={handlePointerDownCenter}
          onPointerMove={handlePointerMoveCenter}
          onPointerUp={handlePointerUpCenter}
          onPointerCancel={handlePointerUpCenter}
        >
          {/* Rotating Platter Center via Direct Ref */}
          <div
            ref={platterRef}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full relative flex items-center justify-center pointer-events-none bg-[#0a0a0c] border border-zinc-700"
          >
            {/* Center Slipmat Graphic */}
            <div className="absolute inset-1 rounded-full bg-[#050505] border border-[#1f1f23] flex flex-col items-center justify-center">
              <span className="text-[7px] font-mono text-zinc-500 uppercase">
                DECK {deckId}
              </span>
              <span className="text-[8px] font-mono font-bold text-white px-2 truncate w-full text-center my-0.5">
                {trackTitle || 'NO TRACK'}
              </span>
              <span className="text-[7px] font-mono text-zinc-500">
                {isScratching ? 'SCRATCH' : isPlaying ? 'PLAY' : 'IDLE'}
              </span>
            </div>

            {/* Turntable Needle Marker Line */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-5 rounded-full bg-white" />
          </div>

          {/* Center Spindle Metal Pin */}
          <div className="absolute w-4 h-4 rounded-full bg-[#27272a] border border-zinc-600 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>

        {/* Scratching Active HUD Overlay */}
        {isScratching && (
          <div className="absolute -bottom-2.5 px-2 py-0.2 rounded-3xl text-[8px] font-bold font-mono tracking-wider bg-white text-black pointer-events-none shadow-md">
            VINYL TOUCH
          </div>
        )}
      </div>
    </div>
  );
};

export const VinylJogWheel = memo(VinylJogWheelComponent);

