import { Track } from '../types/dj';
import { Synthesizer } from './Synthesizer';
import { TrackAnalyzer } from './TrackAnalyzer';

export interface PreloadTrackDefinition {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  genre: string;
  color: string;
  url?: string;
}

export const PRELOADED_TRACKS: PreloadTrackDefinition[] = [
  {
    id: 'track-circus-beat',
    title: 'Circus Beat',
    artist: '50986408',
    genre: 'electronic',
    color: '#ffffff',
    url: '/music/50986408-circus-beat-363489.mp3',
  },
  {
    id: 'track-blackbox',
    title: 'Black Box Freestyle',
    artist: 'Blackbox',
    genre: 'rap',
    color: '#e4e4e7',
    url: '/music/blackbox-black-box-freestyle-rap-beat-13822.mp3',
  },
  {
    id: 'track-flexible-sweetheart',
    title: 'Flexible Sweetheart',
    artist: 'Jonas Blakewood',
    genre: 'pop',
    color: '#d4d4d8',
    url: '/music/jonasblakewood-flexible-sweetheart-305511.mp3',
  },
  {
    id: 'track-bridge-mix',
    title: 'Bridge Mix Beat Drop',
    artist: 'Phantastic Beats',
    genre: 'edm',
    color: '#a1a1aa',
    url: '/music/phantasticbeats-bridge-mix-beat-drop-13761.mp3',
  },
  {
    id: 'track-wasting-my-time',
    title: 'Wasting My Time',
    artist: 'Studio Kolomna',
    genre: 'house',
    color: '#71717a',
    url: '/music/studiokolomna-wasting-my-time-156442.mp3',
  },
  {
    id: 'track-fashion-beat',
    title: 'Fashion Beat',
    artist: 'The Mountain',
    genre: 'dance',
    color: '#3f3f46',
    url: '/music/the_mountain-fashion-beat-512282.mp3',
  },
];

export class TrackLibraryManager {
  private static cachedTracks: Map<string, Track> = new Map();
  private static lazyLocalFiles: Map<string, File> = new Map();

  public static async loadTrack(ctx: AudioContext, def: PreloadTrackDefinition): Promise<Track> {
    if (this.cachedTracks.has(def.id)) {
      return this.cachedTracks.get(def.id)!;
    }

    // Get AudioBuffer (either fetch from URL or generate procedural fallback)
    let audioBuffer: AudioBuffer;
    if (def.url) {
      const response = await fetch(def.url);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } else {
      audioBuffer = await Synthesizer.generateTrack(ctx, {
        bpm: def.bpm || 128,
        genre: def.genre as any,
        durationSeconds: 76.8,
      });
    }

    // Analyze waveform, beat grid, and peaks
    const { waveformData, detectedKey, bpm } = await TrackAnalyzer.analyze(audioBuffer);

    const track: Track = {
      id: def.id,
      title: def.title,
      artist: def.artist,
      bpm: def.bpm || bpm,
      key: def.key || detectedKey,
      duration: audioBuffer.duration,
      genre: def.genre.toUpperCase(),
      color: def.color,
      audioBuffer,
      waveformData,
      isSynthesized: !def.url,
    };

    this.cachedTracks.set(def.id, track);
    return track;
  }

  public static async importLocalFile(ctx: AudioContext, file: File): Promise<Track> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const { waveformData, bpm, detectedKey } = await TrackAnalyzer.analyze(audioBuffer);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    const track: Track = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: cleanTitle,
      artist: 'Local Track',
      bpm,
      key: detectedKey,
      duration: audioBuffer.duration,
      genre: 'CUSTOM',
      color: '#ffffff',
      audioBuffer,
      waveformData,
      isSynthesized: false,
    };

    this.cachedTracks.set(track.id, track);
    return track;
  }

  // Registers a file from a folder import without decoding audio data yet
  public static registerLazyLocalFile(file: File): Track {
    const id = `lazy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.lazyLocalFiles.set(id, file);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    // Return a dummy lightweight track without audioBuffer
    return {
      id,
      title: cleanTitle,
      artist: 'Local Track', // We don't read ID3 upfront for speed
      bpm: 128, // Guessed for now
      key: '1A', // Guessed
      duration: 0,
      genre: 'CUSTOM',
      color: '#a1a1aa', // Zinc color to indicate local file
      isSynthesized: false,
    };
  }

  // Performs actual decoding and analysis only when loaded into a deck
  public static async resolveLazyLocalFile(ctx: AudioContext, id: string): Promise<Track> {
    // If it's already fully decoded and cached, return it
    if (this.cachedTracks.has(id)) {
      return this.cachedTracks.get(id)!;
    }

    const file = this.lazyLocalFiles.get(id);
    if (!file) throw new Error('File not found in local lazy map');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const { waveformData, bpm, detectedKey } = await TrackAnalyzer.analyze(audioBuffer);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    const track: Track = {
      id,
      title: cleanTitle,
      artist: 'Local Track',
      bpm,
      key: detectedKey,
      duration: audioBuffer.duration,
      genre: 'CUSTOM',
      color: '#ffffff',
      audioBuffer,
      waveformData,
      isSynthesized: false,
    };

    this.cachedTracks.set(id, track);
    return track;
  }

  public static async importYouTubeTrack(
    ctx: AudioContext,
    videoData: { id: string; title: string; artist: string; url: string; thumbnail?: string }
  ): Promise<Track> {
    if (this.cachedTracks.has(videoData.id)) {
      return this.cachedTracks.get(videoData.id)!;
    }

    const streamUrl = `/api/youtube?action=stream&url=${encodeURIComponent(videoData.url || videoData.id)}`;
    
    let response: Response;
    try {
      response = await fetch(streamUrl);
    } catch (networkErr: any) {
      throw new Error(`Network error connecting to YouTube audio server: ${networkErr?.message || 'Server connection timed out'}`);
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: 'Audio stream download failed' }));
      throw new Error(errJson.error || `HTTP ${response.status}: Failed to download YouTube audio`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty audio stream from YouTube.');
    }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const { waveformData, bpm, detectedKey } = await TrackAnalyzer.analyze(audioBuffer);

    const track: Track = {
      id: `yt-${videoData.id}`,
      title: videoData.title,
      artist: videoData.artist || 'YouTube Audio',
      bpm,
      key: detectedKey,
      duration: audioBuffer.duration,
      genre: 'YOUTUBE',
      color: '#ffffff',
      audioBuffer,
      waveformData,
      isSynthesized: false,
    };

    this.cachedTracks.set(videoData.id, track);
    return track;
  }
}
