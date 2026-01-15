/**
 * High-quality procedural Web Audio synthesizer.
 * Generates full-length multi-track electronic club tracks and DJ sound effects
 * entirely client-side with zero external assets needed.
 */
export class Synthesizer {
  /**
   * Generates a complete DJ track buffer (approx 90-120 seconds with intro, drop, breakdown, outro)
   */
  public static async generateTrack(
    ctx: AudioContext,
    options: {
      bpm: number;
      genre: 'tech-house' | 'edm' | 'uk-garage' | 'dnb' | 'hiphop';
      durationSeconds?: number;
    }
  ): Promise<AudioBuffer> {
    const { bpm, genre, durationSeconds = 76.8 } = options; // approx 32-48 bars
    const sampleRate = ctx.sampleRate;
    const numChannels = 2;
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const beatDuration = 60 / bpm;
    const totalBeats = Math.floor(durationSeconds / beatDuration);

    // Root frequencies for musical chords
    const chordProgressions: Record<string, number[][]> = {
      'tech-house': [
        [130.81, 155.56, 196.00, 233.08], // C minor 7
        [116.54, 138.59, 174.61, 207.65], // Bb minor 7
        [123.47, 146.83, 185.00, 220.00], // B diminished
        [130.81, 155.56, 196.00, 233.08], // C minor 7
      ],
      'edm': [
        [146.83, 185.00, 220.00, 293.66], // D major
        [110.00, 138.59, 164.81, 220.00], // A major
        [123.47, 146.83, 185.00, 246.94], // B minor
        [98.00, 123.47, 146.83, 196.00],   // G major
      ],
      'uk-garage': [
        [174.61, 207.65, 261.63, 311.13], // F minor 7
        [155.56, 196.00, 233.08, 277.18], // Eb minor 7
        [138.59, 164.81, 207.65, 246.94], // Db major 7
        [130.81, 164.81, 196.00, 246.94], // C 7
      ],
      'dnb': [
        [110.00, 130.81, 164.81, 196.00], // A minor 7
        [98.00, 123.47, 146.83, 174.61],  // G major 7
        [87.31, 110.00, 130.81, 155.56],  // F major 7
        [110.00, 130.81, 164.81, 196.00], // A minor 7
      ],
      'hiphop': [
        [98.00, 116.54, 146.83, 174.61],  // G minor 7
        [87.31, 103.83, 130.81, 155.56],  // F minor 7
        [77.78, 98.00, 116.54, 138.59],   // Eb major 7
        [73.42, 92.50, 110.00, 138.59],   // D 7
      ]
    };

    const chords = chordProgressions[genre] || chordProgressions['tech-house'];

    // Render beat by beat
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * beatDuration;
      const beatSample = Math.floor(beatTime * sampleRate);
      const bar = Math.floor(beat / 4);
      const beatInBar = beat % 4;
      const chordIndex = bar % chords.length;
      const currentChord = chords[chordIndex];

      // Arrangement phases:
      // Bars 0-4: Intro (Drums + Filtered chords)
      // Bars 4-12: Groove Build (Full drums + Bass)
      // Bars 12-16: Breakdown (No kick, sweeping synth chords, riser)
      // Bars 16-24: MAIN DROP (Full kick, heavy bassline, lead synths, open hats)
      // Bars 24-28: Second drop variation
      // Bars 28+: Outro
      const isBreakdown = (bar >= 12 && bar < 16);
      const isDrop = (bar >= 16 && bar < 28);
      const isIntro = bar < 4;

      // 1. KICK DRUM
      if (!isBreakdown) {
        if (genre === 'dnb') {
          // DnB Kick on 0 and 2.5
          if (beatInBar === 0 || (beatInBar === 2)) {
            this.renderKick(left, right, beatSample, sampleRate, 1.0);
          }
        } else if (genre === 'uk-garage') {
          // Garage 2-step kick
          if (beatInBar === 0 || (beatInBar === 3 && beat % 2 === 1)) {
            this.renderKick(left, right, beatSample, sampleRate, 0.95);
          }
        } else if (genre === 'hiphop') {
          if (beatInBar === 0 || (beatInBar === 2 && bar % 2 === 1)) {
            this.renderKick(left, right, beatSample, sampleRate, 1.0);
          }
        } else {
          // Four on the floor (House / EDM / Techno)
          this.renderKick(left, right, beatSample, sampleRate, isDrop ? 1.1 : 0.9);
        }
      }

      // 2. SNARE / CLAP
      if (genre === 'dnb') {
        // Snare on beat 1.5 and 3.5 in DnB tempo
        if (beatInBar === 1 || beatInBar === 3) {
          this.renderSnare(left, right, beatSample, sampleRate, 0.9);
        }
      } else if (genre === 'hiphop') {
        if (beatInBar === 2) {
          this.renderSnare(left, right, beatSample, sampleRate, 1.0);
        }
      } else {
        // House/EDM: Clap/Snare on 2 and 4
        if ((beatInBar === 1 || beatInBar === 3) && !isIntro) {
          this.renderClap(left, right, beatSample, sampleRate, isDrop ? 0.95 : 0.7);
        }
      }

      // 3. HI-HATS (Off-beats and 16th rolls)
      const sixteenth = beatDuration / 4;
      for (let s = 0; s < 4; s++) {
        const subSample = beatSample + Math.floor(s * sixteenth * sampleRate);
        if (subSample >= totalSamples) break;

        // Off-beat open hat (s === 2)
        if (s === 2 && !isIntro) {
          this.renderOpenHat(left, right, subSample, sampleRate, isDrop ? 0.55 : 0.4);
        }
        // Closed hats on 16ths
        if ((s === 0 || s === 1 || s === 3) && (isDrop || !isIntro)) {
          this.renderClosedHat(left, right, subSample, sampleRate, s % 2 === 0 ? 0.25 : 0.15);
        }
      }

      // 4. BASSLINE
      if (!isBreakdown && !isIntro) {
        const rootNote = currentChord[0] / 2; // Sub octave
        this.renderBassNote(left, right, beatSample, sampleRate, beatDuration, rootNote, genre, isDrop);
      }

      // 5. SYNTH CHORDS / ARPS
      if (isBreakdown || isDrop || bar >= 4) {
        const brightness = isBreakdown ? Math.min(1, (beat - 48) / 16) : (isDrop ? 0.9 : 0.5);
        this.renderSynthPad(left, right, beatSample, sampleRate, beatDuration, currentChord, brightness);
      }

      // 6. RISER / BUILDUP (Bar 14-16)
      if (bar >= 14 && bar < 16) {
        const progress = ((bar - 14) * 4 + beatInBar) / 8; // 0 to 1
        this.renderRiser(left, right, beatSample, sampleRate, beatDuration, progress);
      }
    }

    // Apply master limiter / normalizer to avoid harsh clipping
    this.normalizeBuffer(left, right);

    return buffer;
  }

  // --- INSTRUMENT GENERATORS ---

  private static renderKick(left: Float32Array, right: Float32Array, startSample: number, sampleRate: number, gain: number) {
    const len = Math.floor(sampleRate * 0.35); // 350ms
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      // Exponential pitch drop from 150Hz to 45Hz
      const freq = 45 + 110 * Math.exp(-t * 30);
      const amp = Math.exp(-t * 9) * gain;
      const sample = Math.sin(2 * Math.PI * freq * t) * amp;

      // Click transient at start
      const click = (i < 80) ? (Math.random() * 2 - 1) * Math.exp(-t * 200) * 0.4 : 0;
      const finalSample = Math.tanh((sample + click) * 1.3);

      left[idx] += finalSample * 0.9;
      right[idx] += finalSample * 0.9;
    }
  }

  private static renderSnare(left: Float32Array, right: Float32Array, startSample: number, sampleRate: number, gain: number) {
    const len = Math.floor(sampleRate * 0.25);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      // Tone body
      const tone = Math.sin(2 * Math.PI * (180 * Math.exp(-t * 20)) * t) * Math.exp(-t * 18);
      // Snappy noise
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14);
      const sample = (tone * 0.5 + noise * 0.7) * gain;

      left[idx] += sample * 0.8;
      right[idx] += sample * 0.8;
    }
  }

  private static renderClap(left: Float32Array, right: Float32Array, startSample: number, sampleRate: number, gain: number) {
    const len = Math.floor(sampleRate * 0.28);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      // Multi-tap transient pre-claps
      let clapEnvelope = Math.exp(-t * 15);
      if (t < 0.01) clapEnvelope += 0.3 * Math.exp(-t * 400);
      else if (t < 0.02) clapEnvelope += 0.4 * Math.exp(-(t - 0.01) * 300);
      else if (t < 0.03) clapEnvelope += 0.6 * Math.exp(-(t - 0.02) * 200);

      const noise = (Math.random() * 2 - 1) * clapEnvelope * gain * 0.75;
      // Slight stereo spread
      left[idx] += noise * 0.85;
      right[idx] += (noise + (Math.random() * 0.1 - 0.05)) * 0.85;
    }
  }

  private static renderClosedHat(left: Float32Array, right: Float32Array, startSample: number, sampleRate: number, gain: number) {
    const len = Math.floor(sampleRate * 0.05);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 90) * gain;
      left[idx] += noise * 0.7;
      right[idx] += noise * 0.75;
    }
  }

  private static renderOpenHat(left: Float32Array, right: Float32Array, startSample: number, sampleRate: number, gain: number) {
    const len = Math.floor(sampleRate * 0.3);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      // Ring modulation metallic feel
      const metallic = Math.sin(2 * Math.PI * 7800 * t) * Math.sin(2 * Math.PI * 9200 * t);
      const noise = (Math.random() * 2 - 1) * 0.6 + metallic * 0.4;
      const sample = noise * Math.exp(-t * 12) * gain;

      left[idx] += sample * 0.7;
      right[idx] += sample * 0.8;
    }
  }

  private static renderBassNote(
    left: Float32Array,
    right: Float32Array,
    startSample: number,
    sampleRate: number,
    beatDuration: number,
    rootFreq: number,
    genre: string,
    isDrop: boolean
  ) {
    const subBeats = (genre === 'tech-house' || genre === 'edm') ? 2 : 1;
    const noteLen = Math.floor((beatDuration / subBeats) * sampleRate * 0.9);

    for (let sub = 0; sub < subBeats; sub++) {
      const subStart = startSample + Math.floor(sub * (beatDuration / subBeats) * sampleRate);
      for (let i = 0; i < noteLen; i++) {
        const idx = subStart + i;
        if (idx >= left.length) break;

        const t = i / sampleRate;
        const amp = Math.exp(-t * 4) * (isDrop ? 0.6 : 0.45);

        // Rich FM / Sawtooth sub-bass
        const freq = rootFreq * (sub === 1 ? 1.059 : 1.0); // slight groove
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = (2 * ((freq * 2 * t) % 1) - 1) * 0.4; // Saw octave
        const mod = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.5;

        const bassSample = Math.tanh((osc1 + osc2 + mod) * 1.5) * amp;

        left[idx] += bassSample * 0.75;
        right[idx] += bassSample * 0.75;
      }
    }
  }

  private static renderSynthPad(
    left: Float32Array,
    right: Float32Array,
    startSample: number,
    sampleRate: number,
    beatDuration: number,
    chord: number[],
    brightness: number
  ) {
    const len = Math.floor(beatDuration * sampleRate);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      let sumL = 0;
      let sumR = 0;

      for (let c = 0; c < chord.length; c++) {
        const freq = chord[c];
        // Detuned supersaw voices
        const saw1 = (2 * ((freq * t) % 1) - 1);
        const saw2 = (2 * (((freq * 1.008) * t) % 1) - 1);
        const saw3 = (2 * (((freq * 0.992) * t) % 1) - 1);

        const voice = (saw1 + saw2 * 0.7 + saw3 * 0.7) * (0.15 / chord.length);
        sumL += voice;
        sumR += (saw1 * 0.7 + saw2 + saw3 * 0.7) * (0.15 / chord.length);
      }

      // Sidechain compression pump simulation (ducking on downbeats)
      const sidechain = Math.min(1, Math.pow(t / beatDuration, 0.5) * 1.4);
      const amp = sidechain * brightness;

      left[idx] += sumL * amp * 0.5;
      right[idx] += sumR * amp * 0.5;
    }
  }

  private static renderRiser(
    left: Float32Array,
    right: Float32Array,
    startSample: number,
    sampleRate: number,
    beatDuration: number,
    progress: number
  ) {
    const len = Math.floor(beatDuration * sampleRate);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= left.length) break;

      const t = i / sampleRate;
      const currentProg = progress + (i / len) * (1 / 8);
      const freq = 200 + Math.pow(currentProg, 2) * 2800; // 200Hz to 3000Hz sweep
      const noise = (Math.random() * 2 - 1) * currentProg * 0.35;
      const osc = Math.sin(2 * Math.PI * freq * (idx / sampleRate)) * 0.3 * currentProg;

      const sample = (noise + osc) * 0.6;
      left[idx] += sample;
      right[idx] += sample;
    }
  }

  // --- SOUNDBOARD DROPS GENERATION ---

  public static generateSoundEffect(
    ctx: AudioContext,
    type: 'airhorn' | 'laser' | 'subdrop' | 'backspin' | 'siren' | 'scratch' | 'crowd' | 'roll'
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    let duration = 1.5;
    if (type === 'airhorn') duration = 1.2;
    if (type === 'subdrop') duration = 2.0;
    if (type === 'backspin') duration = 1.8;
    if (type === 'siren') duration = 2.5;

    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'airhorn') {
      // Classic DJ Reggae Airhorn: 3 bursts of brass tones (F#4 ~ 370Hz, A4 ~ 440Hz, C#5 ~ 554Hz)
      const bursts = [0, 0.28, 0.56];
      bursts.forEach((startTime) => {
        const startIdx = Math.floor(startTime * sampleRate);
        const burstLen = Math.floor(0.22 * sampleRate);
        for (let i = 0; i < burstLen; i++) {
          const idx = startIdx + i;
          if (idx >= totalSamples) break;
          const t = i / sampleRate;
          const env = Math.sin((i / burstLen) * Math.PI);
          // 3 harmonized brass square/saw waves
          const f1 = 370;
          const f2 = 440;
          const f3 = 554;
          const tone = (
            (Math.sin(2 * Math.PI * f1 * t) > 0 ? 0.5 : -0.5) +
            (Math.sin(2 * Math.PI * f2 * t) > 0 ? 0.4 : -0.4) +
            (Math.sin(2 * Math.PI * f3 * t) > 0 ? 0.3 : -0.3)
          ) * env * 0.7;

          left[idx] += tone;
          right[idx] += tone;
        }
      });
    } else if (type === 'laser') {
      // Sci-fi laser zap drop: 3 rapidly descending pitch sweeps
      const zaps = [0, 0.2, 0.4, 0.6];
      zaps.forEach((startTime) => {
        const startIdx = Math.floor(startTime * sampleRate);
        const zapLen = Math.floor(0.16 * sampleRate);
        for (let i = 0; i < zapLen; i++) {
          const idx = startIdx + i;
          if (idx >= totalSamples) break;
          const t = i / sampleRate;
          const freq = 4000 * Math.exp(-t * 40);
          const sample = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 25) * 0.7;
          left[idx] += sample;
          right[idx] += sample;
        }
      });
    } else if (type === 'subdrop') {
      // Giant 808 Sub-bass drop: 120Hz down to 25Hz with saturation
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const freq = 30 + 100 * Math.exp(-t * 1.8);
        const amp = Math.exp(-t * 1.2);
        const sample = Math.tanh(Math.sin(2 * Math.PI * freq * t) * 2.0) * amp * 0.9;
        left[i] = sample;
        right[i] = sample;
      }
    } else if (type === 'backspin') {
      // Realistic Vinyl Backspin rewind
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        // Pitch ramps wildly up and accelerates backwards
        const speed = Math.max(0.01, (1 - t / duration) * 4);
        const freq = 400 + Math.sin(t * 50) * 200 + speed * 800;
        const noise = (Math.random() * 2 - 1) * 0.2;
        const vinylCrackle = (Math.random() > 0.98 ? Math.random() * 0.5 : 0);
        const sample = (Math.sin(2 * Math.PI * freq * t) * 0.5 + noise + vinylCrackle) * (1 - t / duration) * 0.8;
        left[i] = sample;
        right[i] = sample;
      }
    } else if (type === 'siren') {
      // European Club Police Siren (LFO modulated pitch)
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const lfo = Math.sin(2 * Math.PI * 3.5 * t); // 3.5 Hz siren cycle
        const freq = 700 + lfo * 350; // 350Hz to 1050Hz
        const saw = (2 * ((freq * t) % 1) - 1);
        const sample = saw * (1 - t / duration * 0.3) * 0.55;
        left[i] = sample;
        right[i] = sample;
      }
    } else if (type === 'scratch') {
      // DJ Baby Scratch "Wicky Wicky"
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const modulation = Math.sin(2 * Math.PI * 8 * t);
        const freq = 300 + Math.abs(modulation) * 900;
        const sample = Math.sin(2 * Math.PI * freq * t) * Math.sin(t * Math.PI / duration) * 0.7;
        left[i] = sample;
        right[i] = sample;
      }
    } else if (type === 'roll') {
      // Accelerating snare drum roll
      let currentSample = 0;
      let gap = 0.15; // starts at 150ms
      while (currentSample < totalSamples && gap > 0.015) {
        const snareLen = Math.min(Math.floor(0.08 * sampleRate), totalSamples - currentSample);
        for (let i = 0; i < snareLen; i++) {
          const idx = currentSample + i;
          if (idx >= totalSamples) break;
          const t = i / sampleRate;
          const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 30);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 25);
          left[idx] += (tone * 0.4 + noise * 0.6) * 0.7;
          right[idx] += (tone * 0.4 + noise * 0.6) * 0.7;
        }
        currentSample += Math.floor(gap * sampleRate);
        gap *= 0.88; // accelerates
      }
    }

    this.normalizeBuffer(left, right);
    return buffer;
  }

  private static normalizeBuffer(left: Float32Array, right: Float32Array) {
    let max = 0;
    for (let i = 0; i < left.length; i++) {
      const absL = Math.abs(left[i]);
      const absR = Math.abs(right[i]);
      if (absL > max) max = absL;
      if (absR > max) max = absR;
    }
    if (max > 0.95) {
      const scale = 0.92 / max;
      for (let i = 0; i < left.length; i++) {
        left[i] *= scale;
        right[i] *= scale;
      }
    }
  }
}
