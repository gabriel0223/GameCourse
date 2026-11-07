import { describe, expect, it } from 'vitest';
import {
  ARENA_W,
  COMBO_STEP,
  DASH_TIME,
  FULL_DRAW,
  KINDS,
  PLUSHIE_LIFE,
  PLUSHIE_POINTS,
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

  it('pops a cloud with an arrow', () => {
    const run = running();
    place(run, 'puff', 4, run.player.pos.z);
    shoot(run, { x: 1, z: 0 }, 0.1);
    step(run, {}, 0.6);
    expect(run.enemies).toHaveLength(0);
    expect(run.pops).toBe(1);
    expect(accuracy(run)).toBe(100);
  });

  it('builds the combo with pops and cashes it in on a plushie', () => {
    const run = running();
    run.plushieTimer = 99;
    for (let i = 0; i < COMBO_STEP * 2; i += 1) {
      place(run, 'puff', 4, run.player.pos.z);
      shoot(run, { x: 1, z: 0 }, 0.1);
      step(run, {}, 0.5);
    }
    expect(run.combo).toBe(3);
    expect(run.score).toBe(0);
    run.plushies.push({ id: 900, pos: { x: run.player.pos.x, z: run.player.pos.z + 2 }, life: 5 });
    step(run, { move: { x: 0, z: 1 } }, 0.5);
    expect(run.score).toBe(PLUSHIE_POINTS * 3);
    expect(run.grabbed).toBe(1);
    expect(run.combo).toBe(1);
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

  it('ends the run when a cloud bumps her', () => {
    const run = running();
    place(run, 'puff', run.player.pos.x + 0.5, run.player.pos.z);
    step(run, {}, 1 / 60);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('bumped');
  });

  it('ends the run when an arrow hits a plushie', () => {
    const run = running();
    run.plushies.push({ id: 900, pos: { x: run.player.pos.x + 4, z: run.player.pos.z }, life: 5 });
    // A cloud behind the plushie doesn't help: the plushie is in the way.
    place(run, 'puff', run.player.pos.x + 7, run.player.pos.z);
    shoot(run, { x: 1, z: 0 }, FULL_DRAW + 0.05);
    step(run, {}, 0.5);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('plushie');
    expect(run.pops).toBe(0);
  });

  it('lets a plushie fade away if she leaves it too long', () => {
    const run = running();
    run.plushieTimer = 99;
    run.plushies.push({ id: 900, pos: { x: 6, z: 3 }, life: 1 });
    step(run, {}, 1.1);
    expect(run.plushies).toHaveLength(0);
    expect(run.status).toBe('running');
  });

  it('places new plushies away from her', () => {
    const run = running();
    run.plushieTimer = 0.01;
    let seed = 7;
    const varied = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 6; i += 1) stepCupidRun(run, idle, 1 / 60, varied);
    expect(run.plushies).toHaveLength(1);
    expect(run.plushies[0].life).toBeGreaterThan(PLUSHIE_LIFE - 0.2);
    const gap = Math.hypot(run.plushies[0].pos.x - run.player.pos.x, run.plushies[0].pos.z - run.player.pos.z);
    expect(gap).toBeGreaterThan(3);
  });

  it('lets a dash pass through a cloud unharmed', () => {
    const run = running();
    place(run, 'storm', run.player.pos.x + 2.2, run.player.pos.z);
    step(run, { move: { x: 1, z: 0 }, dash: true }, 1 / 60);
    step(run, { move: { x: 1, z: 0 } }, DASH_TIME - 1 / 60);
    expect(run.status).toBe('running');
    expect(run.player.pos.x).toBeGreaterThan(2.5);
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

  it('starts the next wave after a clear', () => {
    const run = newCupidRun();
    run.status = 'running';
    step(run, {}, 1);
    expect(run.wave).toBe(1);
    run.queue = [];
    run.enemies = [];
    step(run, {}, 1 / 60);
    expect(run.phase).toBe('break');
    step(run, {}, 3);
    expect(run.wave).toBe(2);
  });
});
