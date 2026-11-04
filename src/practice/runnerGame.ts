import type { Control, Device } from './devices';

// Pure rules with no drawing or input, so the game can be tested without a browser.
export const PLAYER_X = 64;
export const SPAWN_X = 340;
export const CONTACT_X = PLAYER_X + 16;
export const COUNTDOWN = 3;
export const WRONG_LOCK = 0.4;
// She takes off here and lands past the obstacle, so the jump is as long as the distance covered.
const HOP_START_X = PLAYER_X + 34;
const HOP_LENGTH = 66;
// Scores where the next group of buttons joins the run.
export const TIER_SCORES = [0, 10, 25];

const speedFor = (score: number) => 90 + Math.min(score, 45) * 2.2;
export const hopProgress = (run: RunState) => (run.hopStart < 0 ? 1 : (run.time - run.hopStart) / run.hopTime);
const gapFor = (score: number) => Math.max(100, 136 - score);

export interface Obstacle {
  id: number;
  x: number;
  control: Control;
  state: 'live' | 'cleared' | 'crashed';
  jumped: boolean;
}

export type RunEvent =
  | { type: 'cleared'; x: number; color: string }
  | { type: 'crashed'; x: number }
  | { type: 'wrong'; pressed: Control }
  | { type: 'tier'; tier: number };

export interface RunState {
  status: 'countdown' | 'running' | 'paused' | 'over';
  time: number;
  countdown: number;
  distance: number;
  score: number;
  streak: number;
  bestStreak: number;
  mistakes: number;
  obstacles: Obstacle[];
  nextId: number;
  nextGap: number;
  lockedUntil: number;
  stumbleUntil: number;
  hopStart: number;
  hopTime: number;
  tier: number;
  lastControl: string | null;
  events: RunEvent[];
}

export function newRun(): RunState {
  return {
    status: 'countdown',
    time: 0,
    countdown: COUNTDOWN,
    distance: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: 0,
    obstacles: [],
    nextId: 1,
    nextGap: 40,
    lockedUntil: 0,
    stumbleUntil: 0,
    hopStart: -1,
    hopTime: 0.5,
    tier: 0,
    lastControl: null,
    events: [],
  };
}

export const currentTarget = (run: RunState) => run.obstacles.find((item) => item.state === 'live');

export const tierFor = (score: number) => TIER_SCORES.filter((value) => score >= value).length - 1;

function pickControl(run: RunState, device: Device, random: () => number): Control {
  const unlocked = device.tiers.slice(0, run.tier + 1);
  // The newest group appears more often, so its buttons get learned quickly.
  const newest = unlocked[unlocked.length - 1];
  const group = run.tier > 0 && random() < 0.6 ? newest : unlocked.flat();
  const options = group.filter((control) => control.id !== run.lastControl);
  return options[Math.floor(random() * options.length) % options.length];
}

export function stepRun(run: RunState, delta: number, device: Device, random: () => number = Math.random) {
  if (run.status === 'countdown') {
    run.countdown -= delta;
    if (run.countdown <= 0) run.status = 'running';
    return;
  }
  if (run.status !== 'running') return;

  run.time += delta;
  const move = speedFor(run.score) * delta;
  run.distance += move;
  for (const item of run.obstacles) item.x -= move;

  run.nextGap -= move;
  if (run.nextGap <= 0) {
    const control = pickControl(run, device, random);
    run.obstacles.push({ id: run.nextId, x: SPAWN_X, control, state: 'live', jumped: false });
    run.nextId += 1;
    run.lastControl = control.id;
    run.nextGap = gapFor(run.score);
  }

  for (const item of run.obstacles) {
    if (item.state === 'cleared' && !item.jumped && item.x <= HOP_START_X) {
      item.jumped = true;
      run.hopStart = run.time;
      run.hopTime = HOP_LENGTH / speedFor(run.score);
    }
  }

  const target = currentTarget(run);
  if (target && target.x <= CONTACT_X) {
    // One hit ends the run, so the score is how far she got without crashing.
    target.state = 'crashed';
    run.streak = 0;
    run.events.push({ type: 'crashed', x: target.x });
    run.status = 'over';
  }
  run.obstacles = run.obstacles.filter((item) => item.x > -30);
}

export function pressControl(run: RunState, control: Control) {
  if (run.status !== 'running' || run.time < run.lockedUntil) return;
  const target = currentTarget(run);
  if (!target) return;
  if (control.id === target.control.id) {
    target.state = 'cleared';
    run.score += 1;
    run.streak += 1;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.events.push({ type: 'cleared', x: target.x, color: target.control.color });
    const tier = tierFor(run.score);
    if (tier > run.tier) {
      run.tier = tier;
      run.events.push({ type: 'tier', tier });
    }
    return;
  }
  // A short stumble makes mashing every button a losing plan, without costing a heart.
  run.mistakes += 1;
  run.streak = 0;
  run.lockedUntil = run.time + WRONG_LOCK;
  run.stumbleUntil = run.lockedUntil;
  run.events.push({ type: 'wrong', pressed: control });
}

export function togglePause(run: RunState) {
  if (run.status === 'running') run.status = 'paused';
  else if (run.status === 'paused') run.status = 'running';
}
