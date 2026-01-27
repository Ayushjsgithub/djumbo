'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  Volume2, 
  Sliders, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Disc, 
  Layers, 
  Zap, 
  X,
  Music,
  Gauge
} from 'lucide-react';

interface DJGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveDemo?: () => void;
}

export const DJGuideModal: React.FC<DJGuideModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'buttons' | 'transition' | 'rules'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#080808] border border-zinc-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#000000]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-3xl bg-white text-black flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-mono font-bold tracking-wide">
                DJUMBO BEGINNER GUIDE & PLAYBOOK
              </h2>
              <p className="text-[11px] text-zinc-400">
                Master the basics of DJ mixing in 60 seconds — zero musical background needed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-3xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#050505] border-b border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-3 py-1.5 rounded-3xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. THE 3-STEP QUICKSTART</span>
          </button>

          <button
            onClick={() => setActiveTab('buttons')}
            className={`px-3 py-1.5 rounded-3xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'buttons'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. WHAT DOES EACH BUTTON DO?</span>
          </button>

          <button
            onClick={() => setActiveTab('transition')}
            className={`px-3 py-1.5 rounded-3xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'transition'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. HOW TO MIX 2 SONGS TOGETHER</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-3xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. THE 2 GOLDEN RULES</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-zinc-300">
          
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800">
                <h3 className="text-white font-mono font-bold text-sm mb-1 flex items-center gap-2">
                  <Disc className="w-4 h-4 text-zinc-300" />
                  WHAT IS DJING IN SIMPLE WORDS?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  DJing is simply <strong className="text-white">playing Song A for the crowd</strong>, while <strong className="text-white">preparing Song B in secret</strong>, and blending them together so the music <strong className="text-white">never stops</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-xs mb-3">
                      1
                    </div>
                    <h4 className="text-white font-mono font-bold text-xs mb-2">
                      LOAD & PLAY SONG 1
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Pick any song from the bottom crate and click <strong className="text-zinc-200">[DECK A]</strong>. Press the white <strong className="text-zinc-200">PLAY</strong> button. This is the song the room is currently dancing to.
                    </p>
                  </div>
                  <div className="mt-4 p-2 rounded-3xl bg-zinc-950 border border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                    Target: Deck A is active
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-xs mb-3">
                      2
                    </div>
                    <h4 className="text-white font-mono font-bold text-xs mb-2">
                      LOAD & SYNC SONG 2
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Choose your next track and click <strong className="text-zinc-200">[DECK B]</strong>. Hit the <strong className="text-zinc-200">SYNC</strong> button so both tracks run at the exact same tempo and never trainwreck!
                    </p>
                  </div>
                  <div className="mt-4 p-2 rounded-3xl bg-zinc-950 border border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                    Target: Deck B matches BPM
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-xs mb-3">
                      3
                    </div>
                    <h4 className="text-white font-mono font-bold text-xs mb-2">
                      TRANSITION & SWAP
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      When Song 1 reaches the buildup or outro, start Song 2 and click <strong className="text-white">SMOOTH BLEND</strong> or slide the <strong className="text-white">CROSSFADER</strong> from left to right!
                    </p>
                  </div>
                  <div className="mt-4 p-2 rounded-3xl bg-zinc-950 border border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                    Result: Seamless club mix
                  </div>
                </div>
              </div>

              {/* Action Callout */}
              <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-zinc-300" />
                  <div>
                    <div className="text-xs font-mono font-bold text-white">WANT TO SEE IT IN ACTION?</div>
                    <div className="text-[11px] text-zinc-400">Try EASY DJ mode for a clean, simplified 2-song console with 1-click auto-mix.</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 rounded-3xl bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>START MIXING NOW</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WHAT DOES EACH BUTTON DO? */}
          {activeTab === 'buttons' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* PLAY / PAUSE */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">PLAY / PAUSE</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Starts or pauses playback. In DJing, you typically let the song play non-stop and only stop it after you've mixed in the next song.
                    </p>
                  </div>
                </div>

                {/* CUE */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-xs">
                    CUE
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">CUE BUTTON</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Jumps instantly back to the first beat (the starting point) of the track so you are ready to drop it on time.
                    </p>
                  </div>
                </div>

                {/* SYNC */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-xs">
                    SYNC
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">SYNC BUTTON (Magic Beatmatch)</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Automatically matches the tempo (BPM) and beat alignment of both decks so the kicks hit together in perfect harmony.
                    </p>
                  </div>
                </div>

                {/* CROSSFADER */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">CROSSFADER (Horizontal Slider)</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Slides the volume between Left (Song 1) and Right (Song 2). Center = both songs are heard equally.
                    </p>
                  </div>
                </div>

                {/* BASS / LOW EQ */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white font-mono font-bold text-xs">
                    LOW
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">BASS / LOW KNOB & KILL</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Controls the deep sub-bass and kick drum. Turning this down removes the heavy beat while keeping vocals and melodies.
                    </p>
                  </div>
                </div>

                {/* SOUND FILTER */}
                <div className="p-3.5 rounded-3xl bg-[#000000] border border-zinc-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">FILTER (Sound Sweep)</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Left gives the muffled "underwater / behind closed doors" sound. Right makes it tinny/crisp for epic buildups.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: HOW TO MIX 2 SONGS TOGETHER */}
          {activeTab === 'transition' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800">
                <h3 className="text-white font-mono font-bold text-xs mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-300" />
                  THE CLASSIC CLUB TRANSITION FORMULA
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <strong className="text-white text-xs">Play Song A (Crossfader to Left)</strong>
                      <p className="text-[11px] text-zinc-400">Let the track play through its main drop.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <strong className="text-white text-xs">Mute Song B's Bass & Click SYNC</strong>
                      <p className="text-[11px] text-zinc-400">On Deck B, click the <strong>KILL LOW</strong> button (or turn Bass slider down). This prevents the songs from fighting.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <strong className="text-white text-xs">Press PLAY on Song B & Bring Crossfader to Center</strong>
                      <p className="text-[11px] text-zinc-400">Both songs are now playing together in sync without muddy clashing bass!</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <strong className="text-white text-xs">THE BASS SWAP (The Climax)</strong>
                      <p className="text-[11px] text-zinc-400">Right when Song B's drop hits: Kill Song A's bass, restore Song B's bass, and fade Song A out. Boom! You just pulled off a pro transition!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THE 2 GOLDEN RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Golden Rule 1 */}
              <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>RULE #1: NEVER PLAY TWO BASSLINES AT THE SAME TIME</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Two basslines playing together will sound muddy, distorted, and ruin the sound system. <strong className="text-white">Always turn down the Bass of one song before turning up the other!</strong>
                </p>
              </div>

              {/* Golden Rule 2 */}
              <div className="p-4 rounded-3xl bg-[#000000] border border-zinc-800">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                  <span>RULE #2: DANCE MUSIC MOVES IN 32-BEAT BLOCKS (PHRASES)</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Every dance song adds a new instrument, drop, or change every <strong className="text-white">32 beats (8 bars)</strong>. Watch the <strong className="text-white">Phrase Countdown Bar</strong> at the top — always drop your new song when the counter hits <strong className="text-white">1</strong>!
                </p>
              </div>

              {/* Academy Callout */}
              <div className="p-3.5 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-300">
                  Want interactive practice? Check out the <strong className="text-white">DJ ACADEMY</strong> tab in the header for 5 step-by-step missions.
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-[#000000]">
          <div className="text-[11px] text-zinc-500 font-mono">
            PRESS ESC OR CLICK OUTSIDE TO CLOSE
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-3xl bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95"
          >
            GOT IT, LET'S DJ!
          </button>
        </div>

      </div>
    </div>
  );
};
