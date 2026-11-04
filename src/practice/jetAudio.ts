import { length, sub } from './jetGame';
import type { JetRun, Vec } from './jetGame';

// Every sound is built live from noise and simple tones, so the game ships with no audio files.
const VOLUME_KEY = 'games-course-sound-v1';
const DEFAULT_VOLUME = 70;
const GUN_GAP = 1 / 14;

export function loadVolume() {
  try {
    const saved = window.localStorage.getItem(VOLUME_KEY);
    const value = saved === null ? DEFAULT_VOLUME : Number(saved);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function saveVolume(value: number) {
  try {
    window.localStorage.setItem(VOLUME_KEY, String(value));
  } catch {
    // The slider still works for this visit when a browser blocks storage.
  }
}

function noise(ctx: BaseAudioContext, seconds: number, deep: boolean) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (deep) {
      // Each sample leans on the one before it, which leaves mostly low rumble.
      last = (last + white * 0.02) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buffer;
}

export interface SoundKit {
  gunshot(when: number): void;
  missile(when: number): void;
  hit(when: number): void;
  boom(when: number, size: number, level: number): void;
  beep(when: number, frequency: number, seconds: number, level: number): void;
  alert(when: number, urgent: boolean): void;
}

export function createSoundKit(ctx: BaseAudioContext, out: AudioNode): SoundKit {
  const white = noise(ctx, 2, false);
  const brown = noise(ctx, 4, true);

  const fade = (when: number, peak: number, seconds: number, attack = 0.002) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + seconds);
    gain.connect(out);
    return gain;
  };
  const burst = (buffer: AudioBuffer, when: number, seconds: number, into: AudioNode) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(into);
    source.start(when, Math.random() * (buffer.duration - 0.1), seconds + 0.05);
  };
  const filter = (type: BiquadFilterType, frequency: number, q: number, into: AudioNode) => {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    node.connect(into);
    return node;
  };
  const sweep = (type: OscillatorType, when: number, from: number, to: number, seconds: number, into: AudioNode) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(to, when + seconds);
    osc.connect(into);
    osc.start(when);
    osc.stop(when + seconds + 0.02);
  };

  return {
    gunshot(when) {
      burst(white, when, 0.08, filter('bandpass', 620 + Math.random() * 220, 0.8, fade(when, 0.42, 0.075)));
      burst(white, when, 0.03, filter('highpass', 3200, 0.7, fade(when, 0.1, 0.022)));
      sweep('sine', when, 150, 52, 0.07, fade(when, 0.42, 0.075));
    },
    missile(when) {
      const body = filter('bandpass', 280, 0.9, fade(when, 0.5, 1.7, 0.05));
      body.frequency.setValueAtTime(280, when);
      body.frequency.exponentialRampToValueAtTime(1900, when + 0.28);
      body.frequency.exponentialRampToValueAtTime(520, when + 1.7);
      burst(white, when, 1.8, body);
      sweep('sine', when, 110, 38, 0.22, fade(when, 0.5, 0.24));
    },
    hit(when) {
      sweep('square', when, 2300, 1500, 0.03, filter('bandpass', 2100, 2.5, fade(when, 0.2, 0.035)));
      burst(white, when, 0.03, filter('highpass', 4200, 0.7, fade(when, 0.08, 0.02)));
    },
    boom(when, size, level) {
      const seconds = 1.5 * size;
      const body = filter('lowpass', 2600, 0.5, fade(when, 1.2 * level, seconds, 0.004));
      body.frequency.setValueAtTime(2600, when);
      body.frequency.exponentialRampToValueAtTime(90, when + seconds);
      burst(brown, when, seconds, body);
      burst(white, when, 0.1, filter('bandpass', 1500, 0.6, fade(when, 0.3 * level, 0.09)));
      sweep('sine', when, 72, 26, seconds * 0.7, fade(when, 0.65 * level, seconds * 0.7, 0.006));
    },
    // Firm but not harsh, because this one can repeat for several seconds.
    alert(when, urgent) {
      const tone = filter('lowpass', 1900, 0.4, fade(when, urgent ? 0.21 : 0.17, 0.12, 0.008));
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = urgent ? 980 : 800;
      osc.connect(tone);
      osc.start(when);
      osc.stop(when + 0.15);
    },
    beep(when, frequency, seconds, level) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(level, when + 0.004);
      gain.gain.setValueAtTime(level, when + Math.max(0.005, seconds - 0.008));
      gain.gain.linearRampToValueAtTime(0, when + seconds);
      gain.connect(out);
      const tone = filter('lowpass', 2800, 0.5, gain);
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = frequency;
      osc.connect(tone);
      osc.start(when);
      osc.stop(when + seconds + 0.01);
    },
  };
}

export interface EngineMix {
  // Speed and boost run from 0 to 1, and strain rises with hard maneuvers.
  set(speed: number, boost: number, strain: number, when: number): void;
  cut(when: number): void;
}

export function createEngine(ctx: BaseAudioContext, out: AudioNode): EngineMix {
  const loop = (buffer: AudioBuffer, into: AudioNode) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(into);
    source.start();
  };
  const bus = ctx.createGain();
  bus.connect(out);
  const voice = (level: number) => {
    const gain = ctx.createGain();
    gain.gain.value = level;
    gain.connect(bus);
    return gain;
  };
  const shaped = (type: BiquadFilterType, frequency: number, q: number, into: AudioNode) => {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    node.connect(into);
    return node;
  };

  // The steady roar of the air and the engines.
  const roarGain = voice(0.18);
  const roarTone = shaped('lowpass', 420, 0.4, roarGain);
  loop(noise(ctx, 5, true), roarTone);
  // A low, slightly uneven throb gives the roar some weight.
  const throbGain = voice(0.045);
  const throbTone = shaped('lowpass', 170, 0.7, throbGain);
  const throbs = [46, 46.7].map((hz) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz;
    osc.connect(throbTone);
    osc.start();
    return osc;
  });
  // The turbine's quiet whine climbs with speed.
  const whineGain = voice(0.008);
  const whine = ctx.createOscillator();
  whine.type = 'triangle';
  whine.frequency.value = 1500;
  whine.connect(whineGain);
  whine.start();
  // The afterburner's tearing noise, and the wind across the wings in hard turns.
  const air = noise(ctx, 3, false);
  const burnGain = voice(0);
  loop(air, shaped('bandpass', 340, 0.45, burnGain));
  const windGain = voice(0);
  const windTone = shaped('bandpass', 1000, 1.1, windGain);
  loop(air, windTone);

  return {
    set(speed, boost, strain, when) {
      const glide = 0.18;
      roarGain.gain.setTargetAtTime(0.15 + speed * 0.08, when, glide);
      roarTone.frequency.setTargetAtTime(340 + speed * 240, when, glide);
      for (const osc of throbs) osc.detune.setTargetAtTime(boost * 350, when, glide);
      throbGain.gain.setTargetAtTime(0.045 + boost * 0.05, when, glide);
      whine.frequency.setTargetAtTime(1250 + speed * 700, when, glide);
      burnGain.gain.setTargetAtTime(boost * 0.13, when, 0.1);
      windGain.gain.setTargetAtTime(Math.min(0.1, strain * 0.06), when, 0.08);
      windTone.frequency.setTargetAtTime(800 + strain * 900, when, 0.08);
    },
    cut(when) {
      bus.gain.setTargetAtTime(0, when, 0.12);
    },
  };
}

export function createMasterChain(ctx: BaseAudioContext, out: AudioNode) {
  const master = ctx.createGain();
  // Keeps the mix even when a gun, an explosion, and an alarm all land together.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter);
  limiter.connect(out);
  return master;
}

// Hearing follows the square of the slider, so its middle sounds like the middle.
const loudness = (volume: number) => (volume / 100) ** 2;

export interface JetAudio {
  update(run: JetRun): void;
  setPaused(paused: boolean): void;
  setVolume(volume: number): void;
  state(): string;
  dispose(): void;
}

export function createJetAudio(volume: number): JetAudio {
  const ctx = new AudioContext();
  const master = createMasterChain(ctx, ctx.destination);
  master.gain.value = loudness(volume);
  const kit = createSoundKit(ctx, master);
  const engine = createEngine(ctx, master);
  let lastCount = 4;
  let nextGun = 0;
  let nextLock = 0;
  let nextAlarm = 0;
  let cut = false;
  let wake = 0;

  const away = (run: JetRun, at: Vec) => 1 / (1 + length(sub(at, run.jet.pos)) / 650);

  return {
    update(run) {
      if (ctx.state === 'suspended' && run.status !== 'paused' && performance.now() > wake) {
        // Browsers can hold audio back until she presses something, so this keeps asking.
        wake = performance.now() + 500;
        void ctx.resume();
      }
      const now = ctx.currentTime;
      if (run.status === 'countdown') {
        const count = Math.ceil(run.countdown);
        if (count < lastCount && count > 0) kit.beep(now, 660, 0.14, 0.12);
        lastCount = count;
      }
      if (lastCount > 0 && run.status === 'running') {
        lastCount = 0;
        kit.beep(now, 1320, 0.3, 0.13);
      }

      for (const event of run.events) {
        if (event.type === 'fired') kit.missile(now);
        if (event.type === 'drone-hit') kit.hit(now);
        if (event.type === 'drone-down') kit.boom(now, 1, Math.max(0.3, away(run, event.pos)));
        if (event.type === 'crashed') kit.boom(now, 1.7, 1);
      }

      if (run.status === 'over') {
        if (!cut) engine.cut(now);
        cut = true;
        return;
      }
      if (run.status !== 'running' && run.status !== 'countdown') return;

      const speed = Math.min(1, Math.max(0, (run.jet.speed - 70) / 120));
      const boost = Math.min(1, Math.max(0, (run.jet.speed - 125) / 60));
      engine.set(speed, boost, Math.abs(run.jet.pitchRate) + Math.abs(run.jet.rollRate) * 0.4, now);

      if (run.firing) {
        if (nextGun < now) nextGun = now;
        while (nextGun < now + 0.05) {
          kit.gunshot(nextGun);
          nextGun += GUN_GAP;
        }
      }

      // The seeker chirps faster as it closes in, then holds a solid tone when it has the target.
      if (run.lock > 0.02 && now >= nextLock) {
        const locked = run.lock >= 1;
        const gap = locked ? 0.09 : 0.34 - run.lock * 0.22;
        kit.beep(now, locked ? 1500 : 1000, locked ? 0.1 : 0.05, 0.075);
        nextLock = now + gap;
      }

      const threat = run.missiles
        .filter((item) => item.enemy)
        .reduce((nearest, item) => Math.min(nearest, length(sub(item.pos, run.jet.pos))), Infinity);
      if (threat < Infinity && now >= nextAlarm) {
        // The pulses hurry as the missile closes, and the last stretch also rises in pitch.
        kit.alert(now, threat < 250);
        nextAlarm = now + (threat < 250 ? 0.16 : threat < 550 ? 0.3 : 0.55);
      }
    },
    setPaused(paused) {
      if (paused) void ctx.suspend();
      else void ctx.resume();
    },
    setVolume(next) {
      master.gain.setTargetAtTime(loudness(next), ctx.currentTime, 0.02);
    },
    state: () => ctx.state,
    dispose() {
      void ctx.close();
    },
  };
}
