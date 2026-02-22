'use client';

import React, { useState, useRef, memo } from 'react';
import { Track } from '../lib/types/dj';
import { PRELOADED_TRACKS, PreloadTrackDefinition, TrackLibraryManager } from '../lib/audio/TrackLibraryData';
import { Music, Upload, Search, Loader2, Play, AlertCircle, Video, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  url: string;
}

interface TrackLibraryProps {
  onLoadDeckA: (track: Track) => void;
  onLoadDeckB: (track: Track) => void;
  audioCtx: AudioContext | null;
  onClose?: () => void;
}

const TrackLibraryComponent: React.FC<TrackLibraryProps> = ({
  onLoadDeckA,
  onLoadDeckB,
  audioCtx,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'local'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  
  // Custom uploaded & YouTube imported tracks
  const [importedTracks, setImportedTracks] = useState<Track[]>([]);
  
  // YouTube Search State
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // Loading indicator for active import
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('');
  
  // Loaded tracking state
  const [loadedTrackDeckA, setLoadedTrackDeckA] = useState<string | null>(null);
  const [loadedTrackDeckB, setLoadedTrackDeckB] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const genres = ['ALL', 'TECH-HOUSE', 'EDM', 'UK-GARAGE', 'DNB', 'HIPHOP', 'YOUTUBE', 'CUSTOM'];

  // Handle YouTube Search or URL Import
  const handleYouTubeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ytQuery.trim()) return;

    setIsSearchingYt(true);
    setYtError(null);

    try {
      // Check if user pasted direct URL
      const isDirectUrl = ytQuery.includes('youtube.com') || ytQuery.includes('youtu.be');
      
      if (isDirectUrl) {
        // Fetch single video info
        const res = await fetch(`/api/youtube?action=info&url=${encodeURIComponent(ytQuery.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch YouTube track info');
        
        const singleResult: YouTubeSearchResult = {
          id: data.track.id,
          title: data.track.title,
          artist: data.track.artist,
          duration: data.track.duration,
          durationFormatted: `${Math.floor(data.track.duration / 60)}:${(data.track.duration % 60).toString().padStart(2, '0')}`,
          thumbnail: data.track.thumbnail,
          url: data.track.url,
        };
        setYtResults([singleResult]);
      } else {
        // Search query
        const res = await fetch(`/api/youtube?action=search&q=${encodeURIComponent(ytQuery.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'YouTube search failed');
        setYtResults(data.videos || []);
      }
    } catch (err: any) {
      console.error('YouTube search error:', err);
      setYtError(err.message || 'Could not find YouTube track. Check connection or URL.');
    } finally {
      setIsSearchingYt(false);
    }
  };

  // Import and load YouTube Track directly to Deck A or Deck B
  const handleLoadYouTubeTrack = async (item: YouTubeSearchResult, targetDeck: 'A' | 'B') => {
    if (!audioCtx) return;
    setLoadingTrackId(item.id);
    setLoadingStatusText('Downloading & analyzing YouTube audio stream...');

    try {
      const track = await TrackLibraryManager.importYouTubeTrack(audioCtx, item);
      
      // Add to local imported tracks crate if not already present
      setImportedTracks(prev => {
        if (prev.some(t => t.id === track.id)) return prev;
        return [track, ...prev];
      });

      if (targetDeck === 'A') {
        onLoadDeckA(track);
        setLoadedTrackDeckA(track.id);
      } else {
        onLoadDeckB(track);
        setLoadedTrackDeckB(track.id);
      }
    } catch (err: any) {
      console.error('Failed to import YouTube track:', err);
      alert(`YouTube Import Error: ${err.message || 'Failed to decode audio stream.'}`);
    } finally {
      setLoadingTrackId(null);
      setLoadingStatusText('');
    }
  };

  const handleLoadPreloaded = async (def: PreloadTrackDefinition, targetDeck: 'A' | 'B') => {
    if (!audioCtx) return;
    setLoadingTrackId(def.id);
    setLoadingStatusText('Synthesizing high-fidelity audio buffer...');
    try {
      const track = await TrackLibraryManager.loadTrack(audioCtx, def);
      if (targetDeck === 'A') {
        onLoadDeckA(track);
        setLoadedTrackDeckA(def.id);
      } else {
        onLoadDeckB(track);
        setLoadedTrackDeckB(def.id);
      }
    } catch (e) {
      console.error('Error loading track:', e);
    } finally {
      setLoadingTrackId(null);
      setLoadingStatusText('');
    }
  };

  const handleLoadCustom = async (track: Track, targetDeck: 'A' | 'B') => {
    if (!audioCtx) return;

    let finalTrack = track;

    if (track.id.startsWith('lazy-')) {
      setLoadingTrackId(track.id);
      setLoadingStatusText(`Loading ${track.title}...`);
      try {
        finalTrack = await TrackLibraryManager.resolveLazyLocalFile(audioCtx, track.id);
        // Replace in importedTracks to cache it visually
        setImportedTracks(prev => prev.map(t => t.id === track.id ? finalTrack : t));
      } catch (err: any) {
        console.error('Failed to resolve lazy track:', err);
        alert(`Failed to load track: ${err.message}`);
        setLoadingTrackId(null);
        setLoadingStatusText('');
        return;
      }
    }

    if (targetDeck === 'A') {
      onLoadDeckA(finalTrack);
      setLoadedTrackDeckA(finalTrack.id);
    } else {
      onLoadDeckB(finalTrack);
      setLoadedTrackDeckB(finalTrack.id);
    }

    setLoadingTrackId(null);
    setLoadingStatusText('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !files.length || !audioCtx) return;
    setLoadingTrackId('uploading');
    setLoadingStatusText('Decoding & analyzing local audio files...');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const track = await TrackLibraryManager.importLocalFile(audioCtx, file);
        setImportedTracks(prev => [track, ...prev]);
      } catch (err) {
        console.error('Error decoding file:', err);
      }
    }
    setLoadingTrackId(null);
    setLoadingStatusText('');
  };

  const handleFolderUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newLazyTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        newLazyTracks.push(TrackLibraryManager.registerLazyLocalFile(file));
      }
    }

    if (newLazyTracks.length > 0) {
      setImportedTracks(prev => [...newLazyTracks, ...prev]);
    }
  };

  const filteredPreloaded = PRELOADED_TRACKS.filter(t => {
    const matchQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = selectedGenre === 'ALL' || t.genre.toUpperCase() === selectedGenre;
    return matchQuery && matchGenre;
  });

  const filteredImported = importedTracks.filter(t => {
    const matchQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = selectedGenre === 'ALL' || 
                       (selectedGenre === 'YOUTUBE' && t.genre === 'YOUTUBE') ||
                       (selectedGenre === 'CUSTOM' && t.genre === 'CUSTOM');
    return matchQuery && matchGenre;
  });

  return (
    <div className="flex flex-col bg-[#000000] border border-[#222222] rounded-3xl p-4 sm:p-5 shadow-xl relative group">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#111111] border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors z-10 hidden sm:flex opacity-0 group-hover:opacity-100"
          title="Close Library"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#18181b]">
        <div className="flex items-center gap-2.5 pr-8">
          <div className="w-10 h-10 rounded-3xl bg-[#111111] border border-zinc-800 flex items-center justify-center">
            <Music className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white">
              MUSIC CRATE & YOUTUBE STREAMER
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              Stream songs straight from YouTube or import your MP3 / WAV files
            </p>
          </div>
        </div>

        {/* Action Buttons (YouTube & Local MP3) */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {onClose && (
            <button
              onClick={onClose}
              className="sm:hidden px-3 py-1.5 rounded-3xl bg-[#141416] hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 border border-zinc-800 transition-all active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span>CLOSE</span>
            </button>
          )}
          {/* YouTube Search / URL Tab Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'youtube' ? 'all' : 'youtube')}
            className={`px-3 py-1.5 rounded-3xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              activeTab === 'youtube'
                ? 'bg-white text-black border-white'
                : 'bg-[#141416] hover:bg-[#202024] text-white border-zinc-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>YOUTUBE STREAM</span>
          </button>

          {/* Local File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-xs font-mono font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 transition-all"
            title="Import selected files"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>FILES</span>
          </button>

          {/* Local Folder Upload Button */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFolderUpload(e.target.files)}
            {...{ webkitdirectory: "", directory: "" }}
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 rounded-3xl bg-[#141416] hover:bg-[#202024] text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 border border-emerald-900/50 hover:border-emerald-700 active:scale-95 transition-all"
            title="Import whole folder without waiting"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>FOLDER</span>
          </button>
        </div>
      </div>

      {/* YOUTUBE LIVE SEARCH / URL IMPORT PANEL */}
      <AnimatePresence mode="wait">
        {activeTab === 'youtube' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="my-3 p-4 bg-[#050505] border border-zinc-800 rounded-3xl flex flex-col gap-4 overflow-hidden"
          >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-zinc-400" />
              SEARCH YOUTUBE OR PASTE ANY YOUTUBE LINK
            </span>
            <span className="text-[9px] font-mono text-zinc-500">
              Direct audio extraction & BPM analysis
            </span>
          </div>

          <form onSubmit={handleYouTubeSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search song/artist (e.g. 'Fred again Rumble') or paste https://youtube.com/watch?v=..."
                value={ytQuery}
                onChange={(e) => setYtQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-3xl bg-[#0a0a0a] border border-zinc-800 text-xs font-sans text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingYt || !ytQuery.trim()}
              className="px-5 py-2 rounded-3xl bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              {isSearchingYt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>SEARCH</span>
            </button>
          </form>

          {/* YouTube Error Alert */}
          {ytError && (
            <div className="p-3 rounded-3xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{ytError}</span>
            </div>
          )}

          {/* YouTube Search Results Grid */}
          {ytResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-3xl border border-[#18181b] divide-y divide-[#141416] bg-[#000000]">
              {ytResults.map((item) => {
                const isLoading = loadingTrackId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-2 sm:p-2.5 flex items-center justify-between gap-3 hover:bg-[#0a0a0a] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-12 h-9 object-cover rounded-3xl bg-zinc-900 flex-shrink-0 border border-zinc-800"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded-3xl bg-[#111111] flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-sans font-bold text-white truncate max-w-[240px] sm:max-w-md">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                          <span className="truncate">{item.artist}</span>
                          <span>-</span>
                          <span>{item.durationFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Load Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isLoading ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden sm:inline">DOWNLOADING...</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleLoadYouTubeTrack(item, 'A')}
                            className="px-3 py-1.5 rounded-3xl bg-[#111111] hover:bg-white hover:text-black border border-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-all active:scale-95"
                          >
                            DECK A
                          </button>
                          <button
                            onClick={() => handleLoadYouTubeTrack(item, 'B')}
                            className="px-3 py-1.5 rounded-3xl bg-[#111111] hover:bg-white hover:text-black border border-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-all active:scale-95"
                          >
                            DECK B
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Status HUD for Active Analysis / Downloads */}
      {loadingTrackId && (
        <div className="mb-2 p-3 rounded-3xl bg-[#080808] border border-zinc-700 flex items-center gap-2.5 text-xs font-mono text-zinc-200 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-white flex-shrink-0" />
          <span>{loadingStatusText || 'Processing & analyzing audio...'}</span>
        </div>
      )}

      {/* Search & Genre Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 my-2">
        {/* Crate Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search loaded tracks by title, artist, BPM, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-3xl bg-[#080808] border border-[#1f1f23] text-xs font-sans text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-2 py-0.5 rounded-3xl text-[9px] font-mono font-bold whitespace-nowrap transition-all ${
                selectedGenre === g
                  ? 'bg-white text-black'
                  : 'bg-[#080808] text-zinc-400 hover:text-white border border-[#1f1f23]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tracks Table */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-3xl border border-[#18181b]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#050505] text-zinc-500 text-[9px] border-b border-[#18181b] sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3">TITLE & ARTIST</th>
              <th className="py-2 px-2">SOURCE / GENRE</th>
              <th className="py-2 px-2">BPM</th>
              <th className="py-2 px-2">KEY</th>
              <th className="py-2 px-3 text-right">LOAD TO DECK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141416] bg-[#000000]">
            {/* YouTube & User Uploaded Tracks */}
            {filteredImported.map((track) => {
              const isDeckA = loadedTrackDeckA === track.id;
              const isDeckB = loadedTrackDeckB === track.id;
              const isYouTube = track.genre === 'YOUTUBE';
              return (
                <tr key={track.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      <div>
                        <div className="font-bold text-white font-sans">{track.title}</div>
                        <div className="text-[10px] text-zinc-400 font-sans">{track.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.2 rounded-3xl text-[8px] font-mono font-bold border ${
                      isYouTube
                        ? 'bg-[#1c1c20] text-white border-zinc-600'
                        : 'bg-[#141416] text-zinc-400 border-zinc-800'
                    }`}>
                      {isYouTube ? 'YOUTUBE' : 'USER FILE'}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-bold text-zinc-200">{track.bpm}</td>
                  <td className="py-2 px-2 text-zinc-300 font-bold">{track.key}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleLoadCustom(track, 'A')}
                        className={`px-2.5 py-1 rounded-3xl text-[9px] font-bold border transition-all ${
                          isDeckA
                            ? 'bg-white border-white text-black'
                            : 'bg-[#0d0d0d] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        {isDeckA ? 'ON DECK A' : 'DECK A'}
                      </button>
                      <button
                        onClick={() => handleLoadCustom(track, 'B')}
                        className={`px-2.5 py-1 rounded-3xl text-[9px] font-bold border transition-all ${
                          isDeckB
                            ? 'bg-white border-white text-black'
                            : 'bg-[#0d0d0d] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        {isDeckB ? 'ON DECK B' : 'DECK B'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Preloaded Synth Anthems */}
            {filteredPreloaded.map((def) => {
              const isLoading = loadingTrackId === def.id;
              const isDeckA = loadedTrackDeckA === def.id;
              const isDeckB = loadedTrackDeckB === def.id;
              return (
                <tr key={def.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <div>
                        <div className="font-bold text-white font-sans flex items-center gap-1.5">
                          {def.title}
                          <span className="text-[8px] text-zinc-400 font-mono font-normal">[SYNTH]</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-sans">{def.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className="px-1.5 py-0.2 rounded-3xl text-[8px] bg-[#141416] text-zinc-400 border border-zinc-800">
                      {def.genre.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-bold text-zinc-200">{def.bpm}</td>
                  <td className="py-2 px-2 text-zinc-300 font-bold">{def.key}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isLoading ? (
                        <div className="flex items-center gap-1 text-[9px] text-zinc-300">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>SYNTHESIZING...</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleLoadPreloaded(def, 'A')}
                            className={`px-2.5 py-1 rounded-3xl text-[9px] font-bold border transition-all ${
                              isDeckA
                                ? 'bg-white border-white text-black'
                                : 'bg-[#0d0d0d] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'
                            }`}
                          >
                            {isDeckA ? 'ON DECK A' : 'DECK A'}
                          </button>
                          <button
                            onClick={() => handleLoadPreloaded(def, 'B')}
                            className={`px-2.5 py-1 rounded-3xl text-[9px] font-bold border transition-all ${
                              isDeckB
                                ? 'bg-white border-white text-black'
                                : 'bg-[#0d0d0d] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'
                            }`}
                          >
                            {isDeckB ? 'ON DECK B' : 'DECK B'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TrackLibrary = memo(TrackLibraryComponent);
