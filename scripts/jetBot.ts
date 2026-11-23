// Plays Sunset Ace with a simple bot, to see how long runs last and what ends them.
// Run with: npx vite-node scripts/jetBot.ts
import {
  NO_STEER,
  add,
  currentTarget,
  dot,
  dropFlares,
  fireMissile,
  isLocked,
  leadPoint,
  length,
  newJetRun,
  normalize,
  rightWing,
  stepJetRun,
  sub,
  underGuns,
} from '../src/practice/jetGame';
import type { JetRun, Steer } from '../src/practice/jetGame';

const STEP = 1 / 60;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

interface Skill {
  name: string;
  // Seconds before reacting to a missile, and whether flares get used.
  flares: boolean;
  breaks: boolean;
  jink: boolean;
  aim: number;
}

function pointAt(run: JetRun, at: { x: number; y: number; z: number }, aim: number): Steer {
  const { jet } = run;
  const to = normalize(sub(at, jet.pos));
  const right = dot(to, rightWing(jet));
  const up = dot(to, jet.up);
  const ahead = dot(to, jet.nose);
  if (ahead > 0.93) return { ...NO_STEER, pitch: clamp(up * 9 * aim, -1, 1), yaw: clamp(right * 9 * aim, -1, 1) };
  // Roll the target over the canopy, then pull.
  const roll = clamp(Math.atan2(right, up) * 1.6, -1, 1);
  return { ...NO_STEER, roll, pitch: up > -0.2 ? 1 : 0.4, boost: ahead < 0 ? 1 : 0 };
}

function decide(run: JetRun, skill: Skill, random: () => number): Steer {
  const { jet } = run;
  if (jet.pos.y < 260 && jet.nose.y < 0.1) {
    const bank = Math.atan2(-rightWing(jet).y, jet.up.y);
    return { ...NO_STEER, roll: clamp(-bank * 1.5, -1, 1), pitch: jet.up.y > 0.3 ? 1 : 0, boost: 1 };
  }
  const threat = run.missiles
    .filter((m) => m.enemy && m.tracking)
    .map((m) => length(sub(m.pos, jet.pos)))
    .sort((a, b) => a - b)[0];
  if (threat !== undefined) {
    if (skill.flares && threat < 600) dropFlares(run, random);
    if (skill.breaks && threat < 230) return { ...NO_STEER, roll: rightWing(jet).y > -0.9 ? 1 : 0, pitch: 1, boost: 1 };
  }
  if (skill.jink && underGuns(run)) return { ...NO_STEER, roll: 0.6, pitch: 1, boost: 1 };
  const target = currentTarget(run);
  if (!target) return { ...NO_STEER, pitch: jet.pos.y < 700 ? 0.3 : 0 };
  const range = length(sub(target.pos, jet.pos));
  const steer = pointAt(run, range < 800 ? leadPoint(run, target) : target.pos, skill.aim);
  steer.gun = range < 700 && dot(normalize(sub(leadPoint(run, target), jet.pos)), jet.nose) > 0.996;
  if (isLocked(run)) fireMissile(run);
  if (range < 250) steer.brake = 1;
  return steer;
}

function play(seed: number, skill: Skill) {
  const random = seeded(seed);
  const run = newJetRun(random);
  let hits = 0;
  while (run.status !== 'over' && run.time < 600) {
    const steer = run.status === 'countdown' ? NO_STEER : decide(run, skill, random);
    stepJetRun(run, STEP, steer, random);
    for (const event of run.events) if (event.type === 'hurt' && event.amount < 50) hits += 1;
    run.events.length = 0;
  }
  return { time: run.time, wave: run.wave, kills: run.kills, score: run.score, ending: run.ending ?? 'timeout', hits, combo: run.bestCombo };
}

const skills: Skill[] = [
  { name: 'careless', flares: false, breaks: false, jink: false, aim: 0.7 },
  { name: 'breaks only', flares: false, breaks: true, jink: false, aim: 0.8 },
  { name: 'uses everything', flares: true, breaks: true, jink: true, aim: 1 },
];
for (const skill of skills) {
  const runs = Array.from({ length: 16 }, (_, i) => play(i * 7919 + 3, skill));
  const avg = (f: (r: (typeof runs)[0]) => number) => (runs.reduce((s, r) => s + f(r), 0) / runs.length).toFixed(1);
  const endings: Record<string, number> = {};
  for (const r of runs) endings[r.ending] = (endings[r.ending] ?? 0) + 1;
  console.log(
    `${skill.name.padEnd(16)} time ${avg((r) => r.time)}s  wave ${avg((r) => r.wave)} (max ${Math.max(...runs.map((r) => r.wave))})  kills ${avg((r) => r.kills)}  score ${avg((r) => r.score)}  gun hits ${avg((r) => r.hits)}  ${JSON.stringify(endings)}`,
  );
}
