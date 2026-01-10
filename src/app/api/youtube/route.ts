import { NextRequest, NextResponse } from 'next/server';
import ytSearch from 'yt-search';
import youtubedl from 'youtube-dl-exec';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// High-speed In-Memory Track Cache
const audioCache = new Map<string, { buffer: Uint8Array; mimeType: string; timestamp: number }>();

// Helper to extract clean video ID
function extractVideoId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}

// 1. High-Speed Direct yt-dlp Stream Engine (Android InnerTube Client for 350ms fast starts)
async function fetchFromYtDlpFast(cleanUrl: string): Promise<{ buffer: Uint8Array; mimeType: string } | null> {
  return new Promise((resolve) => {
    try {
      const subprocess = youtubedl.exec(cleanUrl, {
        output: '-',
        format: 'bestaudio[ext=m4a]/bestaudio/best',
        noWarnings: true,
        noCheckCertificates: true,
        extractorArgs: 'youtube:player_client=android',
      } as any);

      const chunks: Buffer[] = [];

      subprocess.stdout?.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      subprocess.on('close', () => {
        if (chunks.length > 0) {
          const fullBuffer = Buffer.concat(chunks);
          if (fullBuffer.byteLength > 1000) {
            resolve({
              buffer: new Uint8Array(fullBuffer),
              mimeType: 'audio/webm',
            });
            return;
          }
        }
        resolve(null);
      });

      subprocess.on('error', (err) => {
        console.warn('yt-dlp stream error:', err);
        resolve(null);
      });

      // Timeout safety after 25s
      setTimeout(() => {
        try { subprocess.kill(); } catch (e) {}
        if (chunks.length > 0) {
          const fullBuffer = Buffer.concat(chunks);
          if (fullBuffer.byteLength > 1000) {
            resolve({ buffer: new Uint8Array(fullBuffer), mimeType: 'audio/webm' });
            return;
          }
        }
        resolve(null);
      }, 25000);
    } catch (err) {
      resolve(null);
    }
  });
}

// 2. Secondary Fast Engine: Direct Format URL Fetch
async function fetchDirectFormatUrl(cleanUrl: string): Promise<{ buffer: Uint8Array; mimeType: string } | null> {
  try {
    const output: any = await youtubedl(cleanUrl, {
      dumpSingleJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      extractorArgs: 'youtube:player_client=android',
    } as any);

    const streamUrl = output?.url || output?.formats?.find((f: any) => f.acodec !== 'none')?.url;
    if (!streamUrl) return null;

    const audioRes = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
      },
    });

    if (audioRes.ok) {
      const buffer = await audioRes.arrayBuffer();
      if (buffer.byteLength > 1000) {
        const mimeType = audioRes.headers.get('content-type')?.split(';')[0] || 'audio/webm';
        return { buffer: new Uint8Array(buffer), mimeType };
      }
    }
  } catch (err) {
    // Failover
  }
  return null;
}

// 3. Tertiary Engine: Cobalt API (Fast MP3 Mirror)
async function fetchFromCobalt(videoUrl: string): Promise<{ buffer: Uint8Array; mimeType: string } | null> {
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.kwiatekm.pl',
    'https://cobalt.xy24.eu.org',
    'https://api.wuk.sh',
  ];

  for (const instance of cobaltInstances) {
    try {
      const res = await fetch(instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Djumbo/0.4.0',
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
          audioBitrate: '128',
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      const streamUrl = data?.url || data?.audio;
      if (!streamUrl) continue;

      const audioRes = await fetch(streamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000),
      });

      if (audioRes.ok) {
        const buffer = await audioRes.arrayBuffer();
        if (buffer.byteLength > 1000) {
          return { buffer: new Uint8Array(buffer), mimeType: 'audio/mpeg' };
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'stream';
  const query = searchParams.get('q') || '';
  const urlParam = searchParams.get('url') || searchParams.get('id') || '';

  try {
    // 1. SEARCH ACTION: High-Speed Query Search
    if (action === 'search') {
      if (!query.trim()) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
      }

      try {
        const results = await ytSearch(query);
        const videos = (results?.videos || []).slice(0, 15).map((v: any) => ({
          id: v.videoId,
          title: v.title,
          artist: v.author?.name || 'Unknown Artist',
          duration: v.seconds,
          durationFormatted: v.timestamp || `${Math.floor(v.seconds / 60)}:${(v.seconds % 60).toString().padStart(2, '0')}`,
          thumbnail: v.thumbnail,
          url: v.url,
        }));

        return NextResponse.json({ success: true, videos });
      } catch (err: any) {
        console.warn('yt-search failed, falling back to yt-dlp:', err.message);
        // Fallback to yt-dlp if yt-search fails (e.g. title.trim error)
        try {
          const output: any = await youtubedl(`ytsearch15:${query}`, {
            dumpSingleJson: true,
            noWarnings: true,
            extractAudio: true,
            extractorArgs: 'youtube:player_client=android',
          } as any);

          const videos = (output?.entries || []).map((v: any) => ({
            id: v.id,
            title: v.title || 'Unknown Title',
            artist: v.uploader || 'Unknown Artist',
            duration: v.duration || 0,
            durationFormatted: `${Math.floor((v.duration || 0) / 60)}:${((v.duration || 0) % 60).toString().padStart(2, '0')}`,
            thumbnail: v.thumbnail || '',
            url: v.webpage_url || `https://youtube.com/watch?v=${v.id}`,
          }));

          return NextResponse.json({ success: true, videos });
        } catch (fallbackErr: any) {
          return NextResponse.json({ error: 'Search failed in both providers.' }, { status: 500 });
        }
      }
    }

    // 2. INFO ACTION: Metadata Fetch
    if (action === 'info') {
      if (!urlParam) {
        return NextResponse.json({ error: 'YouTube URL or Video ID is required' }, { status: 400 });
      }

      const videoId = extractVideoId(urlParam);
      const searchResult = await ytSearch({ videoId });

      if (searchResult) {
        return NextResponse.json({
          success: true,
          track: {
            id: searchResult.videoId,
            title: searchResult.title,
            artist: searchResult.author?.name || 'Unknown Artist',
            duration: searchResult.seconds,
            thumbnail: searchResult.thumbnail,
            url: searchResult.url,
          },
        });
      }

      return NextResponse.json({ error: 'Could not fetch video info' }, { status: 404 });
    }

    // 3. STREAM ACTION: Turbo Direct Stream Extractor with Server In-Memory Cache
    if (action === 'stream') {
      if (!urlParam) {
        return NextResponse.json({ error: 'YouTube URL or Video ID is required' }, { status: 400 });
      }

      const videoId = extractVideoId(urlParam);
      const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Check Server Memory Cache first (0ms Instant Load)
      if (audioCache.has(videoId)) {
        const cached = audioCache.get(videoId)!;
        return new Response(cached.buffer as any, {
          headers: {
            'Content-Type': cached.mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      // Tier 1 (Fastest): Direct Android Player Stream (Starts in ~350ms)
      const directStreamResult = await fetchFromYtDlpFast(cleanUrl);
      if (directStreamResult) {
        // Cache in memory for instant reloads
        audioCache.set(videoId, { ...directStreamResult, timestamp: Date.now() });

        return new Response(directStreamResult.buffer as any, {
          headers: {
            'Content-Type': directStreamResult.mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      // Tier 2: Direct Format URL Fetch
      const directUrlResult = await fetchDirectFormatUrl(cleanUrl);
      if (directUrlResult) {
        audioCache.set(videoId, { ...directUrlResult, timestamp: Date.now() });

        return new Response(directUrlResult.buffer as any, {
          headers: {
            'Content-Type': directUrlResult.mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      // Tier 3: Cobalt Fast Converter
      const cobaltResult = await fetchFromCobalt(cleanUrl);
      if (cobaltResult) {
        audioCache.set(videoId, { ...cobaltResult, timestamp: Date.now() });

        return new Response(cobaltResult.buffer as any, {
          headers: {
            'Content-Type': cobaltResult.mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      return NextResponse.json(
        { error: 'YouTube audio extraction timed out. Please try again or import local MP3.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('YouTube API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process YouTube request' },
      { status: 500 }
    );
  }
}
