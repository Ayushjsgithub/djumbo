import { SoundboardSample } from '../types/dj';
import { Synthesizer } from './Synthesizer';

export const DEFAULT_SOUNDBOARD_SAMPLES: SoundboardSample[] = [
  {
    id: 'airhorn',
    name: 'AIR HORN',
    category: 'HYPE',
    color: '#ff2d55',
    keyShortcut: '1',
  },
  {
    id: 'laser',
    name: 'LASER ZAP',
    category: 'SFX',
    color: '#00f2ff',
    keyShortcut: '2',
  },
  {
    id: 'subdrop',
    name: '808 BOOM',
    category: 'BASS',
    color: '#a855f7',
    keyShortcut: '3',
  },
  {
    id: 'backspin',
    name: 'BACKSPIN',
    category: 'TURNTABLE',
    color: '#f59e0b',
    keyShortcut: '4',
  },
  {
    id: 'siren',
    name: 'CLUB SIREN',
    category: 'HYPE',
    color: '#ef4444',
    keyShortcut: '5',
  },
  {
    id: 'scratch',
    name: 'BABY SCRATCH',
    category: 'TURNTABLE',
    color: '#10b981',
    keyShortcut: '6',
  },
  {
    id: 'roll',
    name: 'SNARE ROLL',
    category: 'BUILDUP',
    color: '#ec4899',
    keyShortcut: '7',
  },
];

export class SoundboardManager {
  private static buffers: Map<string, AudioBuffer> = new Map();

  public static async init(ctx: AudioContext): Promise<Map<string, AudioBuffer>> {
    const types: ('airhorn' | 'laser' | 'subdrop' | 'backspin' | 'siren' | 'scratch' | 'roll')[] = [
      'airhorn',
      'laser',
      'subdrop',
      'backspin',
      'siren',
      'scratch',
      'roll'
    ];

    types.forEach((type) => {
      if (!this.buffers.has(type)) {
        const buffer = Synthesizer.generateSoundEffect(ctx, type);
        this.buffers.set(type, buffer);
      }
    });

    return this.buffers;
  }

  public static play(ctx: AudioContext, destination: AudioNode, sampleId: string, volume: number = 0.85) {
    let buffer = this.buffers.get(sampleId);
    if (!buffer) {
      buffer = Synthesizer.generateSoundEffect(ctx, sampleId as any);
      this.buffers.set(sampleId, buffer);
    }

    if (buffer) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(destination);
      source.start();
    }
  }
}
