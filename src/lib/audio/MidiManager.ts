import { AudioEngine } from './AudioEngine';

export class MidiManager {
  private static midiAccess: any = null;
  private static connectedDevices: string[] = [];
  private static onDeviceChangeListeners: ((devices: string[]) => void)[] = [];

  public static async init(engine: AudioEngine): Promise<boolean> {
    if (typeof navigator === 'undefined' || !(navigator as any).requestMIDIAccess) {
      console.warn('Web MIDI API is not supported in this browser.');
      return false;
    }

    try {
      this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.updateDeviceList();

      this.midiAccess.onstatechange = () => {
        this.updateDeviceList();
      };

      for (const input of this.midiAccess.inputs.values()) {
        input.onmidimessage = (event: any) => this.handleMidiMessage(event, engine);
      }

      return true;
    } catch (e) {
      console.warn('MIDI Access request denied or failed:', e);
      return false;
    }
  }

  private static updateDeviceList() {
    if (!this.midiAccess) return;
    const names: string[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      if (input.name) names.push(input.name);
    }
    this.connectedDevices = names;
    this.onDeviceChangeListeners.forEach(cb => cb(names));
  }

  public static onDevicesChange(callback: (devices: string[]) => void) {
    this.onDeviceChangeListeners.push(callback);
    callback(this.connectedDevices);
  }

  private static handleMidiMessage(event: any, engine: AudioEngine) {
    const [status, data1, data2] = event.data;
    const command = status >> 4;
    const channel = status & 0xf;

    // Control Change (Knobs, Faders, Jog Wheels)
    if (command === 0xb) {
      const ccNumber = data1;
      const value = data2 / 127; // 0 to 1

      switch (ccNumber) {
        // Crossfader (Standard CC 8 or 10 or 31)
        case 8:
        case 10:
        case 31:
          engine.setCrossfader(value);
          break;

        // Deck A Volume Fader (CC 19 or 7 on Ch 1)
        case 19:
        case 7:
          if (channel === 0) engine.setVolume('A', value);
          else engine.setVolume('B', value);
          break;

        // Deck A EQ Low (CC 20)
        case 20:
          engine.setEQLow('A', (value - 0.5) * 48);
          break;
        // Deck A EQ Mid (CC 21)
        case 21:
          engine.setEQMid('A', (value - 0.5) * 48);
          break;
        // Deck A EQ High (CC 22)
        case 22:
          engine.setEQHigh('A', (value - 0.5) * 48);
          break;
        // Deck A Filter (CC 23)
        case 23:
          engine.setFilter('A', (value - 0.5) * 2);
          break;

        // Deck B Volume Fader (CC 29)
        case 29:
          engine.setVolume('B', value);
          break;
        // Deck B EQ Low (CC 30)
        case 30:
          engine.setEQLow('B', (value - 0.5) * 48);
          break;
        // Deck B EQ Mid (CC 32)
        case 32:
          engine.setEQMid('B', (value - 0.5) * 48);
          break;
        // Deck B EQ High (CC 33)
        case 33:
          engine.setEQHigh('B', (value - 0.5) * 48);
          break;
        // Deck B Filter (CC 34)
        case 34:
          engine.setFilter('B', (value - 0.5) * 2);
          break;

        // Jog Wheel Relative Scratching (CC 35 & 36)
        case 35: {
          const delta = data2 > 64 ? (data2 - 128) : data2;
          engine.scratchMove('A', delta * 0.05);
          break;
        }
        case 36: {
          const delta = data2 > 64 ? (data2 - 128) : data2;
          engine.scratchMove('B', delta * 0.05);
          break;
        }
      }
    }

    // Note On (Play/Pause, CUE, Hot Cues, Sync buttons)
    if (command === 0x9 && data2 > 0) {
      const note = data1;
      // Deck A standard notes
      if (note === 60) { // C4 - Play Deck A
        const state = engine.getDeckState('A');
        if (state.isPlaying) engine.pause('A');
        else engine.play('A');
      } else if (note === 61) { // C#4 - Cue Deck A
        engine.pressCue('A');
      } else if (note === 62) { // D4 - Sync Deck A
        engine.syncDeck('A');
      } else if (note >= 64 && note <= 71) { // Hot Cues 1-8 Deck A
        engine.triggerHotCue('A', note - 64);
      }

      // Deck B standard notes
      else if (note === 72) { // C5 - Play Deck B
        const state = engine.getDeckState('B');
        if (state.isPlaying) engine.pause('B');
        else engine.play('B');
      } else if (note === 73) { // C#5 - Cue Deck B
        engine.pressCue('B');
      } else if (note === 74) { // D5 - Sync Deck B
        engine.syncDeck('B');
      } else if (note >= 76 && note <= 83) { // Hot Cues 1-8 Deck B
        engine.triggerHotCue('B', note - 76);
      }
    }

    // Note Off for Cue release
    if (command === 0x8 || (command === 0x9 && data2 === 0)) {
      const note = data1;
      if (note === 61) engine.releaseCue('A');
      if (note === 73) engine.releaseCue('B');
    }
  }
}
