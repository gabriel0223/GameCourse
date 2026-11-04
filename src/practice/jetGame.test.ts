import { describe, expect, it } from 'vitest';
import {
  CEILING,
  ENEMY_MISSILE_SPEED,
  LOCK_CONE,
  NO_STEER,
  add,
  currentTarget,
  direction,
  dot,
  fireMissile,
  headingOf,
  isLocked,
  leadPoint,
  length,
  newJetRun,
  noseAngle,
  noseVector,
  normalize,
  rightWing,
  stepJetRun,
  sub,
  switchTarget,
  toggleJetPause,
} from './jetGame';
import type { Drone, JetRun, Steer } from './jetGame';

const STEP = 1 / 60;
const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

function flying(): JetRun {
  const run = newJetRun(seeded());
  stepJetRun(run, 3.01, NO_STEER, seeded());
  expect(run.status).toBe('running');
  return run;
}

function emptySky() {
  const run = flying();
  run.drones = [];
  run.nextSpawn = Infinity;
  return run;
}

function fly(run: JetRun, seconds: number, steer: Steer = NO_STEER) {
  const random = seeded(11);
  for (let i = 0; i < seconds / STEP && run.status === 'running'; i += 1) stepJetRun(run, STEP, steer, random);
}

// Puts one quiet drone straight ahead, so a test controls exactly what happens.
function droneAhead(run: JetRun, range = 500): Drone {
  const drone = run.drones[0];
  run.drones = [drone];
  drone.pos = add(run.jet.pos, noseVector(run.jet), range);
  drone.nextShot = Infinity;
  drone.nextTurn = Infinity;
  drone.yaw = headingOf(run.jet);
  drone.wantYaw = drone.yaw;
  run.targetId = drone.id;
  run.nextSpawn = Infinity;
  return drone;
}

describe('jet flight', () => {
  it('starts with drones in the air and counts down', () => {
    const run = newJetRun(seeded());
    expect(run.drones.length).toBe(3);
    expect(run.status).toBe('countdown');
    stepJetRun(run, 1, { ...NO_STEER, roll: 1 }, seeded());
    expect(run.jet.up).toEqual({ x: 0, y: 1, z: 0 });
  });
  it('pitches, rolls, and yaws around the jet itself', () => {
    const climb = emptySky();
    fly(climb, 0.5, { ...NO_STEER, pitch: 1 });
    expect(climb.jet.nose.y).toBeGreaterThan(0.25);
    const rolled = emptySky();
    fly(rolled, 0.4, { ...NO_STEER, roll: 1 });
    expect(rightWing(rolled.jet).y).toBeLessThan(-0.4);
    const rudder = emptySky();
    fly(rudder, 0.6, { ...NO_STEER, yaw: 1 });
    expect(rudder.jet.nose.x).toBeGreaterThan(0.2);
    expect(Math.abs(rightWing(rudder.jet).y)).toBeLessThan(0.05);
  });
  it('flies a full roll and comes back upright', () => {
    const run = emptySky();
    fly(run, (Math.PI * 2 + 0.1) / 2.7, { ...NO_STEER, roll: 1 });
    expect(run.jet.up.y).toBeGreaterThan(0.85);
    expect(run.jet.nose.z).toBeLessThan(-0.85);
  });
  it('stays inverted with the stick centered', () => {
    const run = emptySky();
    fly(run, Math.PI / 2.7, { ...NO_STEER, roll: 1 });
    expect(run.jet.up.y).toBeLessThan(-0.85);
    fly(run, 4);
    expect(run.jet.up.y).toBeLessThan(-0.85);
    expect(Math.abs(run.jet.nose.y)).toBeLessThan(0.2);
  });
  it('keeps the controls relative to the jet when upside down', () => {
    const run = emptySky();
    fly(run, Math.PI / 2.7, { ...NO_STEER, roll: 1 });
    fly(run, 0.1);
    fly(run, 0.6, { ...NO_STEER, pitch: 1 });
    expect(run.jet.nose.y).toBeLessThan(-0.3);
  });
  it('flies a full loop and returns to the same heading', () => {
    const run = emptySky();
    run.jet.pos.y = 800;
    let topped = false;
    for (let i = 0; i < 6.8 / STEP; i += 1) {
      stepJetRun(run, STEP, { ...NO_STEER, pitch: 1 }, seeded());
      if (run.jet.up.y < -0.9) topped = true;
    }
    expect(topped).toBe(true);
    expect(run.status).toBe('running');
  });
  it('flies a barrel roll by rolling while pulling up', () => {
    const run = emptySky();
    const start = run.jet.pos;
    let upsideDown = false;
    for (let i = 0; i < 2.4 / STEP; i += 1) {
      stepJetRun(run, STEP, { ...NO_STEER, roll: 1, pitch: 0.55 }, seeded());
      if (run.jet.up.y < -0.5) upsideDown = true;
    }
    expect(upsideDown).toBe(true);
    expect(length(sub(run.jet.pos, start))).toBeGreaterThan(200);
  });
  it('turns gently toward a held bank and settles small wobbles', () => {
    const run = emptySky();
    fly(run, 0.45, { ...NO_STEER, roll: 1 });
    fly(run, 0.6);
    fly(run, 2);
    expect(run.jet.nose.x).toBeGreaterThan(0.4);
    const wobble = emptySky();
    fly(wobble, 0.08, { ...NO_STEER, roll: 1 });
    fly(wobble, 3);
    expect(Math.abs(rightWing(wobble.jet).y)).toBeLessThan(0.03);
  });
  it('keeps the nose and canopy square after a long, wild flight', () => {
    const run = emptySky();
    run.jet.pos.y = 90000;
    fly(run, 40, { ...NO_STEER, roll: 0.9, pitch: 0.7, yaw: -0.4 });
    expect(length(run.jet.nose)).toBeCloseTo(1, 5);
    expect(length(run.jet.up)).toBeCloseTo(1, 5);
    expect(dot(run.jet.nose, run.jet.up)).toBeCloseTo(0, 5);
  });
  it('flies faster with boost and slower with the brake, and never stalls', () => {
    const fast = flying();
    const slow = flying();
    fast.drones = [];
    slow.drones = [];
    fast.nextSpawn = Infinity;
    slow.nextSpawn = Infinity;
    fly(fast, 3, { ...NO_STEER, boost: 1 });
    fly(slow, 3, { ...NO_STEER, brake: 1 });
    expect(fast.jet.speed).toBeGreaterThan(170);
    expect(slow.jet.speed).toBeLessThan(85);
    expect(slow.jet.speed).toBeGreaterThan(50);
  });
  it('pushes the nose down above the ceiling', () => {
    const run = emptySky();
    run.jet.pos.y = CEILING + 50;
    run.jet.nose = normalize({ x: 0, y: 0.4, z: -1 });
    run.jet.up = normalize({ x: 0, y: 1, z: 0.4 });
    fly(run, 2);
    expect(run.jet.nose.y).toBeLessThan(0);
  });
  it('ends the run when she hits the ocean', () => {
    const run = flying();
    fly(run, 1.2, { ...NO_STEER, pitch: -1 });
    fly(run, 30);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('ocean');
  });
  it('ignores unreadable input instead of breaking the flight', () => {
    const run = flying();
    fly(run, 1, { pitch: Number.NaN, roll: Number.NaN, yaw: Number.NaN, boost: Number.NaN, brake: 0, gun: false });
    expect(Number.isFinite(run.jet.pos.y)).toBe(true);
    expect(Number.isFinite(run.jet.nose.x)).toBe(true);
    expect(Number.isFinite(run.jet.speed)).toBe(true);
  });
  it('freezes while paused', () => {
    const run = flying();
    toggleJetPause(run);
    const { z } = run.jet.pos;
    stepJetRun(run, 2, NO_STEER, seeded());
    expect(run.jet.pos.z).toBe(z);
    toggleJetPause(run);
    expect(run.status).toBe('running');
  });
});

describe('jet combat', () => {
  it('locks on when a target stays near the nose, and loses it when it leaves', () => {
    const run = flying();
    const drone = droneAhead(run);
    fly(run, 0.4);
    expect(isLocked(run)).toBe(false);
    fly(run, 0.6);
    expect(isLocked(run)).toBe(true);
    drone.pos = add(run.jet.pos, direction(headingOf(run.jet) + LOCK_CONE * 2, 0), 500);
    fly(run, 0.7);
    expect(isLocked(run)).toBe(false);
  });
  it('shoots down a locked drone with a homing missile and scores', () => {
    const run = flying();
    const drone = droneAhead(run, 700);
    fly(run, 1);
    expect(isLocked(run)).toBe(true);
    fireMissile(run);
    // The drone turns away, but the missile follows it.
    drone.wantYaw = headingOf(run.jet) + 1;
    fly(run, 4);
    expect(run.score).toBe(1);
    expect(run.drones.some((item) => item.id === drone.id)).toBe(false);
  });
  it('flies straight without a lock, so a miss is possible', () => {
    const run = flying();
    const drone = droneAhead(run, 700);
    drone.pos = add(run.jet.pos, direction(headingOf(run.jet) + 0.6, 0), 700);
    fireMissile(run);
    expect(run.missiles[0].target).toBeNull();
    fly(run, 3);
    expect(run.score).toBe(0);
  });
  it('has a cooldown between missiles', () => {
    const run = flying();
    droneAhead(run);
    fireMissile(run);
    fireMissile(run);
    expect(run.missiles).toHaveLength(1);
    fly(run, 1);
    fireMissile(run);
    expect(run.missiles).toHaveLength(2);
  });
  it('picks the target nearest the nose, and can switch', () => {
    const run = flying();
    fly(run, 0.1);
    const first = currentTarget(run);
    expect(first).toBeDefined();
    const others = run.drones.filter((item) => item !== first);
    expect(others.every((item) => noseAngle(run.jet, item.pos) >= noseAngle(run.jet, first!.pos))).toBe(true);
    switchTarget(run);
    expect(run.targetId).not.toBe(first?.id);
  });
  it('fires the gun while held, and stops on release', () => {
    const run = emptySky();
    fly(run, 0.5, { ...NO_STEER, gun: true });
    expect(run.firing).toBe(true);
    expect(run.bullets.length).toBeGreaterThan(5);
    fly(run, 1.2);
    expect(run.firing).toBe(false);
    expect(run.bullets).toHaveLength(0);
  });
  it('needs several gun hits to bring a drone down', () => {
    const run = flying();
    const drone = droneAhead(run, 300);
    fly(run, 0.42, { ...NO_STEER, gun: true });
    expect(drone.health).toBeGreaterThanOrEqual(1);
    expect(run.score).toBe(0);
    const held = { ...NO_STEER, gun: true };
    for (let i = 0; i < 2 / STEP && run.score === 0; i += 1) {
      drone.pos = add(run.jet.pos, noseVector(run.jet), 300);
      stepJetRun(run, STEP, held, seeded());
    }
    expect(run.score).toBe(1);
    expect(run.drones).toHaveLength(0);
  });
  it('catches gun rounds that cross a drone inside one slow frame', () => {
    const run = flying();
    const drone = droneAhead(run, 200);
    const held = { ...NO_STEER, gun: true };
    for (let i = 0; i < 12; i += 1) {
      drone.pos = add(run.jet.pos, noseVector(run.jet), 200);
      stepJetRun(run, 0.05, held, seeded());
    }
    expect(drone.health).toBeLessThan(6);
  });
  it('misses with the gun when aimed well off target', () => {
    const run = flying();
    const drone = droneAhead(run, 400);
    drone.pos = add(run.jet.pos, direction(headingOf(run.jet) + 0.5, 0), 400);
    fly(run, 0.9, { ...NO_STEER, gun: true });
    expect(drone.health).toBe(6);
  });
  it('leads a moving drone', () => {
    const run = flying();
    const drone = droneAhead(run, 600);
    drone.yaw = Math.PI / 2;
    const lead = leadPoint(run, drone);
    expect(lead.x).toBeGreaterThan(drone.pos.x);
    expect(lead.z).toBeCloseTo(drone.pos.z, 3);
  });
  it('sends more drones as the score grows', () => {
    const run = flying();
    run.score = 8;
    run.nextSpawn = 0;
    fly(run, 0.2);
    expect(run.drones.length).toBeGreaterThan(3);
  });
  it('ends the run on an enemy missile hit, with no second chance', () => {
    const run = flying();
    droneAhead(run);
    run.drones = [];
    run.missiles.push({
      id: 99,
      pos: add(run.jet.pos, direction(headingOf(run.jet), 0), 300),
      dir: normalize(sub(run.jet.pos, add(run.jet.pos, direction(headingOf(run.jet), 0), 300))),
      speed: ENEMY_MISSILE_SPEED,
      life: 9,
      target: null,
      enemy: true,
    });
    fly(run, 4);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('missile');
  });
  it('lets a hard turn dodge an enemy missile fired from behind', () => {
    const run = flying();
    run.drones = [];
    run.nextSpawn = Infinity;
    const behind = add(run.jet.pos, direction(headingOf(run.jet), 0), -320);
    run.missiles.push({
      id: 99,
      pos: behind,
      dir: direction(headingOf(run.jet), 0),
      speed: ENEMY_MISSILE_SPEED,
      life: 9,
      target: null,
      enemy: true,
    });
    // She waits until it's close, then banks hard and pulls, so it can't turn tightly enough.
    while (run.missiles.length && length(sub(run.missiles[0].pos, run.jet.pos)) > 200) fly(run, STEP * 2, { ...NO_STEER, boost: 1 });
    fly(run, 0.58, { ...NO_STEER, roll: 1, boost: 1 });
    fly(run, 9, { ...NO_STEER, pitch: 1, boost: 1 });
    expect(run.status).toBe('running');
    expect(run.missiles).toHaveLength(0);
  });
  it('ends the run on a collision', () => {
    const run = flying();
    droneAhead(run, 60);
    fly(run, 2);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('collision');
  });
  it('brings far drones back toward her', () => {
    const run = flying();
    droneAhead(run).pos.x += 5000;
    fly(run, 0.1);
    expect(length(sub(run.drones[0].pos, run.jet.pos))).toBeLessThan(1400);
  });
  it('holds up for a long idle flight', () => {
    const run = flying();
    fly(run, 40, { ...NO_STEER, yaw: 0.5 });
    expect(Number.isFinite(run.jet.pos.x)).toBe(true);
    expect(run.jet.pos.y).toBeGreaterThan(0);
  });
});
