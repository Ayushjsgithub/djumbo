'use client';

import React, { useState, memo } from 'react';
import { DeckState } from '../lib/types/dj';
import { CheckCircle2, ArrowRight, Play, Zap, Volume2, Sparkles, Trophy, HelpCircle, GraduationCap } from 'lucide-react';

interface DJAcademyViewProps {
  deckA: DeckState;
  deckB: DeckState;
  onPlayA: () => void;
  onPlayB: () => void;
  onSyncB: () => void;
  onSeekA: (time: number) => void;
  onSeekB: (time: number) => void;
  onSetEQLowA: (val: number) => void;
  onSetEQLowB: (val: number) => void;
  onAutoMix: () => void;
}

const DJAcademyViewComponent: React.FC<DJAcademyViewProps> = ({
  deckA,
  deckB,
  onPlayA,
  onPlayB,
  onSyncB,
  onSeekA,
  onSeekB,
  onSetEQLowA,
  onSetEQLowB,
  onAutoMix,
}) => {
  const [activeLesson, setActiveLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const markCompleted = (index: number) => {
    if (!completedLessons.includes(index)) {
      setCompletedLessons(prev => [...prev, index]);
    }
  };

  const lessons = [
    {
      id: 0,
      title: 'Mission 1: PLAY SONG A (THE MAIN DROP)',
      badge: 'THE BASICS',
      desc: 'DJing is simply playing Song A for the crowd while preparing Song B in secret. Pick a song and hit PLAY on Deck A. This is the track the room is currently dancing to.',
      actionLabel: deckA.isPlaying ? 'SONG 1 IS PLAYING' : 'PRESS PLAY ON SONG 1',
      actionHandler: () => {
        onPlayA();
        markCompleted(0);
      },
      isActionDone: deckA.isPlaying || completedLessons.includes(0),
      tip: 'Notice how the kick drum hits on beat 1, 2, 3, 4. This is your rhythm heartbeat. DJs count these beats to know exactly when to bring in the next song.',
    },
    {
      id: 1,
      title: 'Mission 2: PREPARE & SYNC SONG B',
      badge: 'BEATMATCHING',
      desc: 'Now we prepare Song B in secret. If you try to play two songs at different speeds, they will clash and sound like a train-wreck. Hit SYNC on Deck B so both tracks run at the exact same tempo.',
      actionLabel: deckB.isSync ? 'SONG 2 IS SYNCED & LOCKED' : 'PRESS SYNC ON SONG 2',
      actionHandler: () => {
        onSyncB();
        markCompleted(1);
      },
      isActionDone: deckB.isSync || completedLessons.includes(1),
      tip: 'In modern clubs, almost all professional DJs use Sync to save time, allowing them to focus entirely on creative song selection and smooth EQ mixing.',
    },
    {
      id: 2,
      title: 'Mission 3: GOLDEN RULE #2 - THE 32-BEAT PHRASE',
      badge: 'PHRASING',
      desc: 'Dance music moves in 32-beat blocks (phrases). You always want to mix during the build-up so the new song takes over exactly when the bass drops. Let\'s jump Song 1 to its build-up.',
      actionLabel: 'JUMP SONG 1 TO BUILD-UP',
      actionHandler: () => {
        if (deckA.track) onSeekA(deckA.track.duration * 0.4);
        markCompleted(2);
      },
      isActionDone: completedLessons.includes(2),
      tip: 'Watch the Phrase Countdown bar at the top of the screen. When that countdown hits 1, you know the massive drop is about to hit.',
    },
    {
      id: 3,
      title: 'Mission 4: GOLDEN RULE #1 - NEVER CLASH BASSLINES',
      badge: 'EQ MIXING',
      desc: 'Never play two basslines at the same time! It sounds muddy and distorted. Before we bring Song B in, cut the BASS / LOW knob on Song A so they don\'t fight.',
      actionLabel: deckA.eqLow <= -15 ? 'SONG 1 BASS IS CUT (PERFECT)' : 'CUT BASS ON SONG 1',
      actionHandler: () => {
        onSetEQLowA(-24);
        markCompleted(3);
      },
      isActionDone: deckA.eqLow <= -15 || completedLessons.includes(3),
      tip: 'This simple "Bass Swap" technique is the most essential skill to master. It guarantees your transitions always sound clean, powerful, and professional.',
    },
    {
      id: 4,
      title: 'Mission 5: THE CLASSIC CLUB TRANSITION',
      badge: 'THE BASS SWAP',
      desc: 'The climax: When Song B\'s drop hits, bring the crossfader to the center, cut Song A\'s bass, and fade Song A out. Boom! Trigger the auto-mix to execute the perfect transition.',
      actionLabel: 'EXECUTE TRANSITION',
      actionHandler: () => {
        onAutoMix();
        markCompleted(4);
      },
      isActionDone: completedLessons.includes(4),
      tip: 'Congratulations! You just performed a flawless, professional club transition with zero phase clashing. You are officially ready to DJ a party.',
    },
  ];

  const current = lessons[activeLesson];

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full select-none">
      <div className="bg-[#050505] border border-[#222222] rounded-3xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-3xl bg-[#111111] border border-zinc-800 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-mono font-bold text-white">
              INTERACTIVE DJ ACADEMY (5 STEP-BY-STEP MISSIONS)
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              Complete each hands-on interactive lesson to master the art of DJing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Trophy className="w-4 h-4 text-zinc-300" />
          <span className="text-white font-bold">{completedLessons.length} / 5</span>
          <span className="text-zinc-500">PASSED</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {lessons.map((l, idx) => {
          const isDone = completedLessons.includes(idx);
          const isCurrent = activeLesson === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveLesson(idx)}
              className={`p-2.5 rounded-3xl flex flex-col items-center justify-center font-mono text-[10px] font-bold border transition-all ${
                isCurrent
                  ? 'bg-white text-black border-white shadow-md'
                  : isDone
                  ? 'bg-[#111111] text-zinc-200 border-zinc-700'
                  : 'bg-[#080808] text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-1">
                {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : null}
                <span>STEP {idx + 1}</span>
              </div>
              <span className="text-[7px] opacity-70 font-normal truncate w-full text-center">
                {l.badge}
              </span>
            </button>
          );
        })}
      </div>
      <div className="bg-[#050505] border border-[#222222] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#18181b]">
          <span className="px-2.5 py-0.5 rounded-3xl text-[9px] font-mono font-bold bg-[#141416] text-zinc-300 border border-zinc-700">
            {current.badge}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            LESSON {activeLesson + 1} OF 5
          </span>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-mono font-black text-white mb-2">
            {current.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            {current.desc}
          </p>
        </div>
        <div className="my-2 bg-[#0a0a0a] p-5 rounded-3xl border border-[#1f1f23] flex flex-col items-center justify-center gap-3">
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-widest">
            YOUR MISSION TASK:
          </span>
          <button
            onClick={current.actionHandler}
            className={`w-full max-w-md py-4 px-6 rounded-3xl font-mono font-black text-xs sm:text-sm tracking-wider transition-all border active:scale-95 shadow-lg ${
              current.isActionDone
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-white hover:bg-zinc-200 text-black border-white'
            }`}
          >
            {current.actionLabel}
          </button>
        </div>
        <div className="bg-[#0f0f12] p-4 rounded-3xl border border-zinc-800 text-xs sm:text-sm text-zinc-300 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
          <div className="font-sans">
            <strong className="text-white font-mono">Pro DJ Insight: </strong>
            {current.tip}
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#18181b]">
          <button
            onClick={() => setActiveLesson(prev => Math.max(0, prev - 1))}
            disabled={activeLesson === 0}
            className="px-4 py-2 rounded-3xl bg-[#111111] hover:bg-[#1a1a1e] text-zinc-400 hover:text-white text-xs font-mono disabled:opacity-30 border border-zinc-800"
          >
            PREVIOUS STEP
          </button>

          <button
            onClick={() => setActiveLesson(prev => Math.min(lessons.length - 1, prev + 1))}
            disabled={activeLesson === lessons.length - 1}
            className="px-5 py-2 rounded-3xl bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold disabled:opacity-30 flex items-center gap-1.5"
          >
            <span>NEXT MISSION</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const DJAcademyView = memo(DJAcademyViewComponent);
