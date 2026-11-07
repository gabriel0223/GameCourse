import type { CupidEvent } from './cupidGame';
import { createMasterChain } from './jetAudio';

// Every sound is a few soft tones built live, like Sunset Ace, so there are no audio files.
// Notes step up a major pentatonic scale, so pops in a combo climb into a little tune.
const SCALE = [0, 2, 4, 7, 9];
const note = (step: number, base = 523.25) => base * 2 ** ((SCALE[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);
const loudness = (volume: number) => (volume / 100) ** 2;

export interface CupidAudio {
  play(events: CupidEvent[], combo: number): void;
  tick(final: boolean): void;
  setPaused(paused: boolean): void;
  wake(): void;
  setVolume(volume: number): void;
  dispose(): void;
}

export function createCupidAudio(volume: number): CupidAudio {
  const ctx = new AudioContext();
  const master = createMasterChain(ctx, ctx.destination);
  master.gain.value = loudness(volume);
  // Starting from the Start button counts as a click, so the browser lets sound play.
  void ctx.resume();
  let pops = 0;

  const tone = (type: OscillatorType, from: number, to: number, when: number, seconds: number, level: number, attack = 0.004) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
    gain.connect(master);
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, when + seconds);
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + seconds + 0.02);
  };

  const hiss = (when: number, seconds: number, from: number, to: number, level: number) => {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.2;
    band.frequency.setValueAtTime(from, when);
    band.frequency.exponentialRampToValueAtTime(to, when + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + seconds * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
    source.connect(band);
    band.connect(gain);
    gain.connect(master);
    source.start(when);
  };

  const tune = (steps: number[], when: number, gap: number, level: number, type: OscillatorType = 'triangle') => {
    steps.forEach((step, index) => tone(type, note(step), note(step), when + index * gap, gap * 1.6, level));
  };

  return {
    play(events, combo) {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime + 0.005;
      for (const event of events) {
        switch (event.type) {
          case 'shot':
            // A bowstring twang, brighter for a full draw.
            tone('triangle', event.full ? 900 : 520 + event.power * 260, 160, now, event.full ? 0.18 : 0.12, 0.28);
            hiss(now, event.full ? 0.2 : 0.1, 3200, 900, event.full ? 0.16 : 0.08);
            if (event.full) tone('sine', note(9), note(10), now, 0.16, 0.12);
            break;
          case 'drawFull':
            tone('sine', note(10), note(10), now, 0.14, 0.14);
            tone('sine', note(12), note(12), now + 0.05, 0.16, 0.1);
            break;
          case 'hit':
            tone('square', 260, 180, now, 0.06, 0.08);
            break;
          case 'pop':
            pops += 1;
            tone('sine', 300, note(combo + (pops % 2) * 2, 392), now, 0.09, 0.3);
            tone('triangle', note(combo + 2, 392), note(combo + 2, 392), now + 0.06, 0.14, 0.16);
            if (event.kind === 'storm') tone('sine', 140, 60, now, 0.4, 0.4);
            break;
          case 'pickup':
            tone('sine', note(combo + 5), note(combo + 5), now, 0.08, 0.1);
            tone('sine', note(combo + 7), note(combo + 7), now + 0.045, 0.12, 0.08);
            break;
          case 'combo':
            tune([event.level + 3, event.level + 5, event.level + 7], now + 0.05, 0.05, 0.12);
            break;
          case 'comboLost':
            tune([4, 2, 0], now + 0.05, 0.07, 0.1, 'square');
            break;
          case 'hurt':
            tone('square', 220, 70, now, 0.3, 0.22);
            hiss(now, 0.25, 900, 200, 0.2);
            break;
          case 'dash':
            hiss(now, 0.18, 600, 2800, 0.22);
            break;
          case 'spit':
            tone('sine', 180, 420, now, 0.5, 0.08, 0.2);
            break;
          case 'wave':
            tune([0, 2, 4, 7], now, 0.08, 0.14);
            break;
          case 'cleared':
            tune([5, 7, 9, 10, 12], now, 0.07, 0.15);
            break;
          case 'over':
            tune([7, 4, 2, 0, -3], now + 0.1, 0.13, 0.16);
            break;
          default:
            break;
        }
      }
    },
    tick(final) {
      if (ctx.state !== 'running') return;
      tone('square', final ? 1046 : 523, final ? 1046 : 523, ctx.currentTime + 0.005, final ? 0.3 : 0.12, 0.1);
    },
    setPaused(paused) {
      if (paused) void ctx.suspend();
      else void ctx.resume();
    },
    wake() {
      if (ctx.state === 'suspended') void ctx.resume();
    },
    setVolume(value) {
      master.gain.setTargetAtTime(loudness(value), ctx.currentTime, 0.02);
    },
    dispose() {
      void ctx.close();
    },
  };
}
