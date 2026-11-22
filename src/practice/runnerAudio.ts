import type { RunEvent } from './runnerGame';
import { createMasterChain } from './jetAudio';

// Soft tones built live, like the other minigames, so there are no audio files.
// A clear happens about once a second for minutes, so every sound here is short, round, and quiet:
// sine and triangle waves only, no buzzers, and the clear chime climbs a pentatonic scale
// with the streak, then loops back down so it never gets shrill.
const SCALE = [0, 2, 4, 7, 9];
const note = (step: number, base = 523.25) => base * 2 ** ((SCALE[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5)) / 12);
const loudness = (volume: number) => (volume / 100) ** 2;
// Eight steps cover a bit over an octave and a half before the chime starts again from the bottom.
const CHIME_STEPS = 8;

export interface RunnerAudio {
  play(events: RunEvent[], streak: number): void;
  tick(final: boolean): void;
  setPaused(paused: boolean): void;
  wake(): void;
  setVolume(volume: number): void;
  dispose(): void;
}

export function createRunnerAudio(volume: number): RunnerAudio {
  const ctx = new AudioContext();
  const master = createMasterChain(ctx, ctx.destination);
  master.gain.value = loudness(volume);
  // Starting from the Start button counts as a click, so the browser lets sound play.
  void ctx.resume();

  const tone = (type: OscillatorType, from: number, to: number, when: number, seconds: number, level: number, attack = 0.006) => {
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

  const tune = (steps: number[], when: number, gap: number, level: number) => {
    steps.forEach((step, index) => tone('triangle', note(step), note(step), when + index * gap, gap * 1.8, level));
  };

  return {
    play(events, streak) {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime + 0.005;
      for (const event of events) {
        switch (event.type) {
          case 'cleared': {
            // A light "bloop" that rises with the streak.
            const step = (Math.max(1, streak) - 1) % CHIME_STEPS;
            const pitch = note(step);
            tone('sine', pitch * 0.75, pitch, now, 0.12, 0.2);
            tone('triangle', pitch * 2, pitch * 2, now + 0.02, 0.1, 0.035);
            break;
          }
          case 'wrong':
            // A soft "bonk", low and short, so a mistake is clear without being harsh.
            tone('triangle', 196, 130, now, 0.16, 0.18);
            tone('sine', 98, 82, now, 0.14, 0.12);
            break;
          case 'tier':
            // New buttons join: a quick happy run up the scale.
            tune([5, 7, 9, 10], now + 0.08, 0.07, 0.11);
            break;
          case 'crashed':
            // A thump, then a gentle falling tune.
            tone('sine', 150, 55, now, 0.3, 0.32, 0.003);
            tune([4, 2, 0, -3], now + 0.18, 0.12, 0.1);
            break;
          default:
            break;
        }
      }
    },
    tick(final) {
      // The first tick can land while the browser is still starting sound, so it waits instead of dropping.
      if (ctx.state === 'closed') return;
      const when = ctx.currentTime + 0.005;
      tone('sine', final ? 1046.5 : 523.25, final ? 1046.5 : 523.25, when, final ? 0.28 : 0.12, 0.12);
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
