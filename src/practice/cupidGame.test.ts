import { describe, expect, it } from 'vitest';
import {
  ARENA_W,
  COMBO_STEP,
  DASH_TIME,
  FULL_DRAW,
  KINDS,
  MAX_HP,
  accuracy,
  newCupidRun,
  stepCupidRun,
  waveSpawns,
} from './cupidGame';
import type { CupidInput, CupidRun, Enemy, EnemyKind } from './cupidGame';

const idle: CupidInput = { move: { x: 0, z: 0 }, aim: null, drawing: false, dash: false, assist: false };
const fixed = () => 0.5;

function running(): CupidRun {
  const run = newCupidRun();
  run.status = 'running';
  // Keeps waves out of the way unless a test wants them.
  run.phase = 'fight';
  run.wave = 1;
  run.queue = [{ kind: 'puff', at: 999 }];
  return run;
}

function place(run: CupidRun, kind: EnemyKind, x: number, z: number): Enemy {
  const enemy: Enemy = { id: run.nextId++, kind, pos: { x, z }, hp: KINDS[kind].hp, spawning: 0, windup: 0, cooldown: 99, flash: 0, seed: 0 };
  run.enemies.push(enemy);
  return enemy;
}

function step(run: CupidRun, input: Partial<CupidInput>, seconds: number, frame = 1 / 60) {
  for (let t = 0; t < seconds - 1e-9; t += frame) stepCupidRun(run, { ...idle, ...input }, frame, fixed);
}

// Draws for a while, then lets go.
function shoot(run: CupidRun, aim: { x: number; z: number }, hold: number, assist = false) {
  step(run, { aim, drawing: true, assist }, hold);
  step(run, { aim, assist }, 1 / 60);
}

describe('Love Attack', () => {
  it('waits for the countdown before anything moves', () => {
    const run = newCupidRun();
    step(run, { move: { x: 1, z: 0 } }, 1);
    expect(run.status).toBe('countdown');
    expect(run.player.pos.x).toBe(0);
    step(run, {}, 2.1);
    expect(run.status).toBe('running');
  });

  it('keeps her inside the arena', () => {
    const run = running();
    step(run, { move: { x: 1, z: 0 } }, 5);
    expect(run.player.pos.x).toBe(ARENA_W);
  });

  it('slows her down while she draws the bow', () => {
    const walk = running();
    step(walk, { move: { x: 1, z: 0 } }, 0.5);
    const draw = running();
    step(draw, { move: { x: 1, z: 0 }, drawing: true }, 0.5);
    expect(draw.player.pos.x).toBeLessThan(walk.player.pos.x * 0.6);
  });

  it('makes a tap a weak arrow and a full draw a fast piercing one', () => {
    const tap = running();
    shoot(tap, { x: 1, z: 0 }, 0.05);
    const full = running();
    shoot(full, { x: 1, z: 0 }, FULL_DRAW + 0.05);
    expect(tap.arrows[0].damage).toBe(1);
    expect(tap.arrows[0].pierce).toBe(false);
    expect(full.arrows[0].damage).toBe(3);
    expect(full.arrows[0].pierce).toBe(true);
    expect(full.arrows[0].speed).toBeGreaterThan(tap.arrows[0].speed * 1.8);
    expect(full.events.some((event) => event.type === 'drawFull')).toBe(true);
  });

  it('pops a cloud, drops a heart, and scores it with the combo', () => {
    const run = running();
    place(run, 'puff', 4, run.player.pos.z);
    shoot(run, { x: 1, z: 0 }, 0.1);
    step(run, {}, 0.6);
    expect(run.enemies).toHaveLength(0);
    expect(run.score).toBe(KINDS.puff.points);
    expect(run.hearts).toHaveLength(1);
    // Walking over the heart collects it.
    step(run, { move: { x: 1, z: 0 } }, 1);
    expect(run.hearts).toHaveLength(0);
    expect(run.score).toBeGreaterThan(KINDS.puff.points);
    expect(accuracy(run)).toBe(100);
  });

  it('raises the combo every few pops in a row', () => {
    const run = running();
    for (let i = 0; i < COMBO_STEP; i += 1) {
      place(run, 'puff', 4, run.player.pos.z);
      shoot(run, { x: 1, z: 0 }, 0.1);
      step(run, {}, 0.5);
    }
    expect(run.combo).toBe(2);
    // The next pop is worth double.
    const before = run.score;
    place(run, 'puff', 4, run.player.pos.z);
    shoot(run, { x: 1, z: 0 }, 0.1);
    step(run, {}, 0.3);
    expect(run.score - before).toBeGreaterThanOrEqual(KINDS.puff.points * 2);
  });

  it('clears combo progress on a miss but keeps the level', () => {
    const run = running();
    run.combo = 3;
    run.comboProgress = 2;
    shoot(run, { x: 0, z: -1 }, 0.1);
    step(run, {}, 1.5);
    expect(run.comboProgress).toBe(0);
    expect(run.combo).toBe(3);
    expect(accuracy(run)).toBe(0);
  });

  it('costs a heart and the whole combo when a cloud touches her', () => {
    const run = running();
    run.combo = 4;
    place(run, 'puff', run.player.pos.x + 0.5, run.player.pos.z);
    step(run, {}, 1 / 60);
    expect(run.player.hp).toBe(MAX_HP - 1);
    expect(run.combo).toBe(1);
    // A short grace period stops one touch from taking every heart.
    step(run, {}, 0.5);
    expect(run.player.hp).toBe(MAX_HP - 1);
  });

  it('lets a dash pass through a cloud unharmed', () => {
    const run = running();
    place(run, 'storm', run.player.pos.x + 2.2, run.player.pos.z);
    step(run, { move: { x: 1, z: 0 }, dash: true }, 1 / 60);
    step(run, { move: { x: 1, z: 0 } }, DASH_TIME - 1 / 60);
    expect(run.player.hp).toBe(MAX_HP);
    expect(run.player.pos.x).toBeGreaterThan(2.5);
  });

  it('ends the run on the last heart', () => {
    const run = running();
    run.player.hp = 1;
    place(run, 'puff', run.player.pos.x, run.player.pos.z);
    step(run, {}, 1 / 60);
    expect(run.status).toBe('over');
  });

  it('bends a controller arrow toward a cloud just off the aim line', () => {
    const run = running();
    const enemy = place(run, 'puff', 6, run.player.pos.z + 0.6);
    shoot(run, { x: 1, z: 0 }, 0.1, true);
    const dir = run.arrows[0].dir;
    expect(dir.z).toBeGreaterThan(0.05);
    step(run, {}, 0.8);
    expect(run.enemies.includes(enemy)).toBe(false);
  });

  it('splits a storm into two small clouds', () => {
    const run = running();
    const storm = place(run, 'storm', 5, run.player.pos.z);
    storm.hp = 1;
    shoot(run, { x: 1, z: 0 }, 0.1);
    step(run, {}, 0.4);
    expect(run.enemies.filter((enemy) => enemy.kind === 'puff')).toHaveLength(2);
  });

  it('grows the waves and brings in new clouds over time', () => {
    expect(waveSpawns(1).every((item) => item.kind === 'puff')).toBe(true);
    expect(waveSpawns(3).some((item) => item.kind === 'spitter')).toBe(true);
    expect(waveSpawns(4).filter((item) => item.kind === 'storm')).toHaveLength(1);
    expect(waveSpawns(6).length).toBeGreaterThan(waveSpawns(2).length);
  });

  it('starts the next wave after a clear, with a bonus', () => {
    const run = newCupidRun();
    run.status = 'running';
    step(run, {}, 1);
    expect(run.wave).toBe(1);
    run.queue = [];
    run.enemies = [];
    step(run, {}, 1 / 60);
    expect(run.phase).toBe('break');
    expect(run.score).toBe(20);
    step(run, {}, 3);
    expect(run.wave).toBe(2);
  });
});
