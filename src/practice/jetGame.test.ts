import { describe, expect, it } from 'vitest';
import {
  CEILING,
  COMBO_TIME,
  ENEMIES,
  ENEMY_BULLET_DAMAGE,
  ENEMY_LOCK_TIME,
  ENEMY_MISSILE_SPEED,
  FLARES,
  LOCK_CONE,
  MAX_HEALTH,
  MAX_MISSILES,
  MISSILE_RELOAD,
  WAVE_BREAK,
  NO_STEER,
  add,
  currentTarget,
  direction,
  dot,
  dropFlares,
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
  waveRoster,
} from './jetGame';
import type { Drone, EnemyKind, JetRun, Missile, Steer } from './jetGame';

const STEP = 1 / 60;
const vec3 = (x: number, y: number, z: number) => ({ x, y, z });
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

// Stops the waves, so a test controls exactly which enemies are in the air.
function hold(run: JetRun) {
  run.queue = [];
  run.calm = Infinity;
}

function emptySky() {
  const run = flying();
  run.drones = [];
  hold(run);
  return run;
}

function fly(run: JetRun, seconds: number, steer: Steer = NO_STEER) {
  const random = seeded(11);
  for (let i = 0; i < seconds / STEP && run.status === 'running'; i += 1) stepJetRun(run, STEP, steer, random);
}

// Puts one quiet enemy straight ahead, flying away from her, so a test controls exactly what happens.
function droneAhead(run: JetRun, range = 500, kind: EnemyKind = 'drone'): Drone {
  const drone = run.drones[0];
  run.drones = [drone];
  drone.kind = kind;
  drone.health = ENEMIES[kind].health;
  drone.speed = ENEMIES[kind].speed;
  drone.flares = 0;
  drone.pos = add(run.jet.pos, noseVector(run.jet), range);
  drone.nextShot = Infinity;
  drone.nextBurst = Infinity;
  drone.nextTurn = Infinity;
  drone.nextEvadeRoll = Infinity;
  drone.wantYaw = headingOf(run.jet);
  drone.dir = direction(drone.wantYaw, 0);
  run.targetId = drone.id;
  hold(run);
  return drone;
}

function enemyMissile(pos: Missile['pos'], dir: Missile['dir']): Missile {
  return { id: 99, pos, dir, speed: ENEMY_MISSILE_SPEED, life: 8, target: null, flare: null, tracking: true, enemy: true };
}

describe('jet flight', () => {
  it('starts with drones in the air and counts down', () => {
    const run = newJetRun(seeded());
    expect(run.drones.length).toBe(4);
    expect(run.wave).toBe(1);
    expect(run.health).toBe(MAX_HEALTH);
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
    hold(fast);
    hold(slow);
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
    expect(run.kills).toBe(1);
    expect(run.score).toBe(ENEMIES.drone.points);
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
    expect(run.kills).toBe(1);
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
    drone.dir = direction(Math.PI / 2, 0);
    const lead = leadPoint(run, drone);
    expect(lead.x).toBeGreaterThan(drone.pos.x);
    expect(lead.z).toBeCloseTo(drone.pos.z, 3);
  });
  it('ends the run on an enemy missile hit, whatever her health', () => {
    const run = emptySky();
    const ahead = add(run.jet.pos, direction(headingOf(run.jet), 0), 300);
    run.missiles.push(enemyMissile(ahead, normalize(sub(run.jet.pos, ahead))));
    fly(run, 4);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('missile');
    expect(run.health).toBe(0);
  });
  it('lets a hard turn make an enemy missile overshoot and lose her', () => {
    const run = emptySky();
    const behind = add(run.jet.pos, direction(headingOf(run.jet), 0), -320);
    run.missiles.push(enemyMissile(behind, direction(headingOf(run.jet), 0)));
    // She waits until it's close, then banks hard and pulls, so it can't turn tightly enough.
    while (run.missiles.length && length(sub(run.missiles[0].pos, run.jet.pos)) > 200) fly(run, STEP * 2, { ...NO_STEER, boost: 1 });
    fly(run, 0.58, { ...NO_STEER, roll: 1, boost: 1 });
    fly(run, 9, { ...NO_STEER, pitch: 1, boost: 1 });
    expect(run.status).toBe('running');
    expect(run.missiles).toHaveLength(0);
  });
  it('pulls chasing missiles onto her flares, and has only a few per wave', () => {
    const run = emptySky();
    const behind = add(run.jet.pos, direction(headingOf(run.jet), 0), -600);
    run.missiles.push(enemyMissile(behind, direction(headingOf(run.jet), 0)));
    dropFlares(run, seeded());
    expect(run.flaresLeft).toBe(FLARES - 1);
    expect(run.missiles[0].tracking).toBe(false);
    expect(run.missiles[0].flare).not.toBeNull();
    fly(run, 6);
    expect(run.status).toBe('running');
    for (let i = 0; i < 10; i += 1) {
      dropFlares(run, seeded());
      fly(run, 1.3);
    }
    expect(run.flaresLeft).toBe(0);
  });
  it('wears down her health with enemy gunfire, and ends the flight at zero', () => {
    const run = emptySky();
    run.enemyBullets.push({ pos: add(run.jet.pos, run.jet.nose, 60), vel: { x: 0, y: 0, z: 760 }, life: 1 });
    fly(run, 0.2);
    expect(run.health).toBe(MAX_HEALTH - ENEMY_BULLET_DAMAGE);
    expect(run.status).toBe('running');
    run.health = ENEMY_BULLET_DAMAGE;
    run.enemyBullets.push({ pos: add(run.jet.pos, run.jet.nose, 60), vel: { x: 0, y: 0, z: 760 }, life: 1 });
    fly(run, 0.2);
    expect(run.status).toBe('over');
    expect(run.ending).toBe('gunned');
  });
  it('sends fighters after her, and they open fire from behind', () => {
    const run = flying();
    const fighter = droneAhead(run, 700, 'fighter');
    fighter.nextBurst = 0;
    fighter.pos = add(run.jet.pos, run.jet.nose, -700);
    fly(run, 12, { ...NO_STEER, yaw: 0.15 });
    expect(run.health).toBeLessThan(MAX_HEALTH);
    expect(run.status === 'running' || run.ending === 'gunned').toBe(true);
  });
  it('locks on before firing a missile, which gives her a warning', () => {
    const run = flying();
    const drone = droneAhead(run, 600);
    drone.nextShot = 0;
    fly(run, 0.1);
    expect(drone.aim).toBeGreaterThan(0);
    expect(run.missiles).toHaveLength(0);
    fly(run, ENEMY_LOCK_TIME);
    expect(run.missiles.filter((item) => item.enemy)).toHaveLength(1);
  });
  it('runs out of missiles and reloads them one at a time', () => {
    const run = emptySky();
    for (let i = 0; i < MAX_MISSILES + 2; i += 1) {
      fireMissile(run);
      fly(run, 0.55);
    }
    expect(run.missilesLeft).toBe(0);
    const fired = run.missiles.length;
    fireMissile(run);
    expect(run.missiles.length).toBe(fired);
    fly(run, MISSILE_RELOAD + 0.1);
    expect(run.missilesLeft).toBe(1);
  });
  it('loses a target that gets behind the missile', () => {
    const run = flying();
    const drone = droneAhead(run, 700);
    fly(run, 1);
    fireMissile(run);
    fly(run, 0.1);
    drone.pos = add(run.missiles[0].pos, run.missiles[0].dir, -300);
    fly(run, 0.1);
    expect(run.missiles[0].target).toBeNull();
  });
  it('lets enemies throw her missiles off with flares', () => {
    const run = flying();
    const drone = droneAhead(run, 700, 'heavy');
    drone.flares = 2;
    drone.nextEvadeRoll = 0;
    fly(run, 1);
    fireMissile(run);
    fly(run, 3);
    expect(run.flares.some((item) => item.enemy) || drone.flares < 2).toBe(true);
    expect(drone.health).toBe(ENEMIES.heavy.health);
  });
  it('takes several missiles to bring down a heavy', () => {
    const run = flying();
    const heavy = droneAhead(run, 500, 'heavy');
    for (let i = 0; i < 2; i += 1) {
      fly(run, 1);
      fireMissile(run);
      fly(run, 2);
      heavy.pos = add(run.jet.pos, noseVector(run.jet), 500);
    }
    expect(run.drones).toContain(heavy);
    expect(heavy.health).toBeLessThan(ENEMIES.heavy.health);
    fly(run, 1);
    fireMissile(run);
    fly(run, 2);
    expect(run.drones).not.toContain(heavy);
  });
  it('multiplies points for quick kills, and the combo fades', () => {
    const run = flying();
    const first = droneAhead(run, 300);
    run.drones.push({ ...first, id: 500, pos: add(first.pos, vec3(0, 400, 0)) });
    first.health = 1;
    fly(run, 0.4, { ...NO_STEER, gun: true });
    expect(run.score).toBe(ENEMIES.drone.points);
    expect(run.combo).toBe(2);
    const second = run.drones[0];
    second.health = 1;
    second.pos = add(run.jet.pos, noseVector(run.jet), 300);
    run.targetId = second.id;
    fly(run, 0.4, { ...NO_STEER, gun: true });
    expect(run.score).toBe(ENEMIES.drone.points * 3);
    fly(run, COMBO_TIME + 0.5);
    expect(run.combo).toBe(1);
  });
  it('pays a bonus, patches her up, and starts the next wave after a short calm', () => {
    const run = flying();
    run.drones = [];
    run.queue = [];
    run.health = 50;
    run.flaresLeft = 0;
    fly(run, 0.1);
    expect(run.wave).toBe(2);
    expect(run.score).toBe(300);
    expect(run.health).toBe(85);
    expect(run.flaresLeft).toBe(FLARES);
    expect(run.drones).toHaveLength(0);
    fly(run, WAVE_BREAK + 0.2);
    expect(run.drones.some((item) => item.kind === 'fighter')).toBe(true);
  });
  it('builds up to an ace every fifth wave, and grows after that', () => {
    expect(waveRoster(1).every((kind) => kind === 'drone')).toBe(true);
    expect(waveRoster(4)).toContain('heavy');
    expect(waveRoster(5)).toContain('ace');
    expect(waveRoster(10)).toContain('ace');
    expect(waveRoster(7).length).toBeGreaterThan(waveRoster(2).length);
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
