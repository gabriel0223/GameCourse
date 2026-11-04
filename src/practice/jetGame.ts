// Pure flight and combat rules, with no drawing or input, so they can be tested without a browser.
// One unit is roughly one meter. The jet stores which way its nose and canopy point, so it can fly
// in any attitude: upside down, straight up, or anywhere through a roll.
export interface Vec {
  x: number;
  y: number;
  z: number;
}

export const vec = (x = 0, y = 0, z = 0): Vec => ({ x, y, z });
export const add = (a: Vec, b: Vec, scale = 1): Vec => ({ x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (a: Vec) => Math.sqrt(dot(a, a));
export const normalize = (a: Vec): Vec => {
  const size = length(a) || 1;
  return { x: a.x / size, y: a.y / size, z: a.z / size };
};
export const cross = (a: Vec, b: Vec): Vec => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
// Turns a vector around a unit axis.
export const rotate = (v: Vec, axis: Vec, angle: number): Vec => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const part = dot(axis, v) * (1 - cos);
  return add(add({ x: v.x * cos, y: v.y * cos, z: v.z * cos }, cross(axis, v), sin), axis, part);
};
// Yaw 0 points toward -z, and positive yaw turns right.
export const direction = (yaw: number, pitch: number): Vec => ({
  x: Math.sin(yaw) * Math.cos(pitch),
  y: Math.sin(pitch),
  z: -Math.cos(yaw) * Math.cos(pitch),
});

const clamp = (value: number, low: number, high: number) => (Number.isNaN(value) ? 0 : Math.min(high, Math.max(low, value)));
const approach = (from: number, to: number, rate: number, delta: number) => from + (to - from) * Math.min(1, rate * delta);

export const COUNTDOWN = 3;
export const START_ALTITUDE = 980;
export const CRASH_ALTITUDE = 3;
export const CEILING = 1500;
const CRUISE = 120;
const BOOST = 70;
const BRAKE = 50;
const MAX_PITCH_RATE = 1.15;
const MAX_ROLL_RATE = 2.7;
const MAX_YAW_RATE = 0.8;
// A banked jet turns on its own, so rolling left is enough to start a gentle left turn.
const BANK_TURN_RATE = 0.62;
// Small wobbles settle back to level, while a held bank or inverted flight is left alone.
const LEVEL_ASSIST = 0.42;
const LEVEL_ASSIST_RATE = 1.3;
export const LOCK_CONE = 0.38;
export const LOCK_RANGE = 1150;
const LOCK_TIME = 0.75;
const FIRE_COOLDOWN = 0.9;
const MISSILE_SPEED = 340;
const MISSILE_TURN = 2.5;
const MISSILE_LIFE = 7;
const MISSILE_HIT = 20;
const GUN_GAP = 1 / 14;
export const BULLET_SPEED = 950;
const BULLET_LIFE = 0.85;
const BULLET_HIT = 17;
// Close aim counts, so the gun rewards tracking a target without needing pixel precision.
const GUN_ASSIST = 0.085;
export const DRONE_HEALTH = 6;
// Enemy missiles are beatable: a hard turn shakes them, and boosting nearly matches their speed.
export const ENEMY_MISSILE_SPEED = 205;
const ENEMY_MISSILE_TURN = 0.75;
const ENEMY_MISSILE_LIFE = 9;
const ENEMY_MISSILE_HIT = 12;
const ENEMY_RANGE = 950;
const DRONE_SPEED = 85;
const DRONE_COLLISION = 15;
const DRONE_LEASH = 1900;
const DRONE_LOW = 420;
const DRONE_HIGH = 1200;

export interface Steer {
  // -1 to 1, relative to the jet. Positive pitch lifts the nose toward the canopy,
  // positive roll drops the right wing, and positive yaw swings the nose right.
  pitch: number;
  roll: number;
  yaw: number;
  boost: number;
  brake: number;
  gun: boolean;
}

export const NO_STEER: Steer = { pitch: 0, roll: 0, yaw: 0, boost: 0, brake: 0, gun: false };

export interface Jet {
  pos: Vec;
  nose: Vec;
  up: Vec;
  speed: number;
  pitchRate: number;
  rollRate: number;
  yawRate: number;
}

export interface Drone {
  id: number;
  pos: Vec;
  yaw: number;
  wantYaw: number;
  nextTurn: number;
  nextShot: number;
  health: number;
}

export interface Bullet {
  pos: Vec;
  vel: Vec;
  life: number;
}

export interface Missile {
  id: number;
  pos: Vec;
  dir: Vec;
  speed: number;
  life: number;
  target: number | null;
  enemy: boolean;
}

export type JetEvent =
  | { type: 'fired'; pos: Vec }
  | { type: 'enemy-fired'; pos: Vec }
  | { type: 'drone-hit'; pos: Vec }
  | { type: 'drone-down'; pos: Vec }
  | { type: 'crashed'; pos: Vec };

export type Ending = 'ocean' | 'missile' | 'collision';

export interface JetRun {
  status: 'countdown' | 'running' | 'paused' | 'over';
  time: number;
  countdown: number;
  jet: Jet;
  drones: Drone[];
  missiles: Missile[];
  bullets: Bullet[];
  score: number;
  targetId: number | null;
  lock: number;
  cooldown: number;
  gunCooldown: number;
  firing: boolean;
  nextPylon: number;
  nextId: number;
  nextSpawn: number;
  ending: Ending | null;
  events: JetEvent[];
}

const wantedDrones = (score: number) => Math.min(6, 3 + Math.floor(score / 4));
const shotGap = (score: number) => Math.max(7, 14 - score * 0.5);
const maxEnemyMissiles = (score: number) => (score < 5 ? 1 : score < 12 ? 2 : 3);

export const rightWing = (jet: Jet) => normalize(cross(jet.nose, jet.up));

// The compass direction of the nose. Flying straight up, the belly shows where she came from.
export function headingOf(jet: Jet) {
  const flat = Math.hypot(jet.nose.x, jet.nose.z) > 0.08 ? jet.nose : { ...jet.up, x: jet.up.x * Math.sign(-jet.nose.y), z: jet.up.z * Math.sign(-jet.nose.y) };
  return Math.atan2(flat.x, -flat.z);
}

function spawnDrone(run: JetRun, random: () => number) {
  const { jet } = run;
  const bearing = headingOf(jet) + (random() - 0.5) * 2.2;
  const range = 850 + random() * 500;
  const pos = add(jet.pos, direction(bearing, 0), range);
  pos.y = clamp(jet.pos.y + (random() - 0.5) * 240, DRONE_LOW, DRONE_HIGH);
  const yaw = random() * Math.PI * 2;
  run.drones.push({
    id: run.nextId,
    pos,
    yaw,
    wantYaw: yaw,
    nextTurn: run.time + 2 + random() * 3,
    nextShot: run.time + 10 + random() * 6,
    health: DRONE_HEALTH,
  });
  run.nextId += 1;
}

export function newJetRun(random: () => number = Math.random): JetRun {
  const run: JetRun = {
    status: 'countdown',
    time: 0,
    countdown: COUNTDOWN,
    // She starts in the open above the cloud tops, heading into the sun.
    jet: {
      pos: vec(0, START_ALTITUDE, 0),
      nose: vec(0, 0, -1),
      up: vec(0, 1, 0),
      speed: CRUISE,
      pitchRate: 0,
      rollRate: 0,
      yawRate: 0,
    },
    drones: [],
    missiles: [],
    bullets: [],
    score: 0,
    targetId: null,
    lock: 0,
    cooldown: 0,
    gunCooldown: 0,
    firing: false,
    nextPylon: 1,
    nextId: 1,
    nextSpawn: 0,
    ending: null,
    events: [],
  };
  for (let i = 0; i < wantedDrones(0); i += 1) spawnDrone(run, random);
  return run;
}

export const noseVector = (jet: Jet) => jet.nose;

export function noseAngle(jet: Jet, point: Vec) {
  return Math.acos(clamp(dot(noseVector(jet), normalize(sub(point, jet.pos))), -1, 1));
}

export const currentTarget = (run: JetRun) => run.drones.find((item) => item.id === run.targetId);

function nearestToNose(run: JetRun) {
  let best: Drone | undefined;
  let bestAngle = Infinity;
  for (const drone of run.drones) {
    const angle = noseAngle(run.jet, drone.pos);
    if (angle < bestAngle) {
      best = drone;
      bestAngle = angle;
    }
  }
  return best;
}

export function switchTarget(run: JetRun) {
  if (run.status !== 'running' || run.drones.length < 2) return;
  const order = [...run.drones].sort((a, b) => noseAngle(run.jet, a.pos) - noseAngle(run.jet, b.pos));
  const index = order.findIndex((item) => item.id === run.targetId);
  run.targetId = order[(index + 1) % order.length].id;
  run.lock = 0;
}

export const isLocked = (run: JetRun) => run.lock >= 1;

// Where to point the gun so its rounds meet a moving drone.
export function leadPoint(run: JetRun, drone: Drone) {
  const flight = length(sub(drone.pos, run.jet.pos)) / (BULLET_SPEED + run.jet.speed);
  return add(drone.pos, direction(drone.yaw, 0), DRONE_SPEED * flight);
}

export function fireMissile(run: JetRun) {
  if (run.status !== 'running' || run.cooldown > 0) return;
  const nose = noseVector(run.jet);
  // Missiles drop from alternating wings.
  const pylon = add(add(run.jet.pos, rightWing(run.jet), 4.6 * run.nextPylon), run.jet.up, -1);
  run.nextPylon *= -1;
  run.missiles.push({
    id: run.nextId,
    pos: pylon,
    dir: nose,
    speed: run.jet.speed + 30,
    life: MISSILE_LIFE,
    // Without a lock, the missile just flies straight.
    target: isLocked(run) ? run.targetId : null,
    enemy: false,
  });
  run.nextId += 1;
  run.cooldown = FIRE_COOLDOWN;
  run.events.push({ type: 'fired', pos: run.jet.pos });
}

function endRun(run: JetRun, ending: Ending) {
  run.status = 'over';
  run.ending = ending;
  run.events.push({ type: 'crashed', pos: { ...run.jet.pos } });
}

function shootDown(run: JetRun, drone: Drone) {
  run.drones = run.drones.filter((item) => item !== drone);
  run.score += 1;
  run.nextSpawn = run.time + 2;
  run.events.push({ type: 'drone-down', pos: drone.pos });
}

function turnBy(jet: Jet, axis: Vec, angle: number) {
  jet.nose = rotate(jet.nose, axis, angle);
  jet.up = rotate(jet.up, axis, angle);
}

function stepJet(run: JetRun, steer: Steer, delta: number) {
  const { jet } = run;
  jet.pitchRate = approach(jet.pitchRate, clamp(steer.pitch, -1, 1) * MAX_PITCH_RATE, 6, delta);
  jet.rollRate = approach(jet.rollRate, clamp(steer.roll, -1, 1) * MAX_ROLL_RATE, 7, delta);
  jet.yawRate = approach(jet.yawRate, clamp(steer.yaw, -1, 1) * MAX_YAW_RATE, 5, delta);

  // Every turn happens around the jet's own axes, so the controls mean the same thing upside down.
  turnBy(jet, rightWing(jet), jet.pitchRate * delta);
  jet.up = rotate(jet.up, jet.nose, jet.rollRate * delta);
  jet.nose = rotate(jet.nose, jet.up, -jet.yawRate * delta);

  const right = rightWing(jet);
  const flatness = Math.hypot(jet.nose.x, jet.nose.z);
  // Turns toward the lower wing, fading out when she's pointing straight up or down.
  turnBy(jet, vec(0, 1, 0), right.y * BANK_TURN_RATE * flatness * delta);
  const bank = Math.atan2(-right.y, jet.up.y);
  if (Math.abs(steer.roll) < 0.05 && Math.abs(bank) < LEVEL_ASSIST && flatness > 0.7) {
    jet.up = rotate(jet.up, jet.nose, -bank * LEVEL_ASSIST_RATE * delta);
  }
  if (jet.pos.y > CEILING && jet.nose.y > -0.2) {
    // Past the ceiling, the air is too thin and the nose gently falls.
    const level = normalize(vec(jet.nose.x, -0.35, jet.nose.z));
    jet.nose = turnToward(jet.nose, level, 0.9 * delta);
  }
  // Clears up tiny rounding errors, which would otherwise build up over a long flight.
  jet.nose = normalize(jet.nose);
  jet.up = normalize(cross(rightWing(jet), jet.nose));

  // Climbing costs a little speed and diving adds some.
  const wanted = CRUISE + BOOST * clamp(steer.boost, 0, 1) - BRAKE * clamp(steer.brake, 0, 1) - jet.nose.y * 26;
  jet.speed = approach(jet.speed, wanted, 1.4, delta);
  jet.pos = add(jet.pos, jet.nose, jet.speed * delta);
}

function stepGun(run: JetRun, firing: boolean, delta: number, random: () => number) {
  run.firing = firing;
  run.gunCooldown = Math.max(0, run.gunCooldown - delta);
  const { jet } = run;
  while (firing && run.gunCooldown <= 0) {
    run.gunCooldown += GUN_GAP;
    const target = currentTarget(run);
    let aim = jet.nose;
    if (target) {
      const lead = leadPoint(run, target);
      const close = noseAngle(jet, lead) < GUN_ASSIST && length(sub(target.pos, jet.pos)) < BULLET_SPEED * BULLET_LIFE;
      if (close) aim = normalize(sub(lead, jet.pos));
    }
    const spread = add(add(aim, rightWing(jet), (random() - 0.5) * 0.008), jet.up, (random() - 0.5) * 0.008);
    run.bullets.push({
      pos: add(jet.pos, jet.nose, 9),
      vel: add({ x: jet.nose.x * jet.speed, y: jet.nose.y * jet.speed, z: jet.nose.z * jet.speed }, normalize(spread), BULLET_SPEED),
      life: BULLET_LIFE,
    });
  }
}

function stepBullets(run: JetRun, delta: number) {
  for (const bullet of run.bullets) {
    const from = bullet.pos;
    bullet.pos = add(bullet.pos, bullet.vel, delta);
    bullet.life -= delta;
    const travel = sub(bullet.pos, from);
    const span = dot(travel, travel) || 1;
    // Checks the whole path of the frame, because rounds cover many meters at a time.
    const hit = run.drones.find((drone) => {
      const along = clamp(dot(sub(drone.pos, from), travel) / span, 0, 1);
      return length(sub(drone.pos, add(from, travel, along))) < BULLET_HIT;
    });
    if (!hit) continue;
    bullet.life = 0;
    hit.health -= 1;
    run.events.push({ type: 'drone-hit', pos: bullet.pos });
    if (hit.health <= 0) shootDown(run, hit);
  }
  run.bullets = run.bullets.filter((item) => item.life > 0);
}

function stepDrones(run: JetRun, delta: number, random: () => number) {
  const enemyMissiles = run.missiles.filter((item) => item.enemy).length;
  let fired = enemyMissiles;
  for (const drone of run.drones) {
    if (run.time > drone.nextTurn) {
      drone.wantYaw = drone.yaw + (random() - 0.5) * 2.4;
      drone.nextTurn = run.time + 2 + random() * 3;
    }
    drone.yaw = approach(drone.yaw, drone.wantYaw, 0.7, delta);
    drone.pos = add(drone.pos, direction(drone.yaw, 0), DRONE_SPEED * delta);
    const away = length(sub(drone.pos, run.jet.pos));
    if (away > DRONE_LEASH) {
      // Far drones come back around, so she never has to hunt for the fight.
      drone.pos = add(run.jet.pos, direction(headingOf(run.jet) + (random() - 0.5) * 2.2, 0), 1000);
      drone.pos.y = clamp(run.jet.pos.y, DRONE_LOW, DRONE_HIGH);
    }
    if (run.time > drone.nextShot) {
      drone.nextShot = run.time + shotGap(run.score) + random() * 3;
      if (away < ENEMY_RANGE && fired < maxEnemyMissiles(run.score)) {
        fired += 1;
        run.missiles.push({
          id: run.nextId,
          pos: { ...drone.pos },
          dir: normalize(sub(run.jet.pos, drone.pos)),
          speed: ENEMY_MISSILE_SPEED,
          life: ENEMY_MISSILE_LIFE,
          target: null,
          enemy: true,
        });
        run.nextId += 1;
        run.events.push({ type: 'enemy-fired', pos: { ...drone.pos } });
      }
    }
  }
}

function turnToward(from: Vec, to: Vec, maxAngle: number) {
  const angle = Math.acos(clamp(dot(from, to), -1, 1));
  if (angle <= maxAngle || angle < 1e-4) return to;
  return normalize(add(from, sub(to, from), maxAngle / angle));
}

function stepMissiles(run: JetRun, delta: number) {
  for (const missile of run.missiles) {
    missile.life -= delta;
    if (missile.enemy) {
      missile.dir = turnToward(missile.dir, normalize(sub(run.jet.pos, missile.pos)), ENEMY_MISSILE_TURN * delta);
    } else {
      missile.speed = approach(missile.speed, MISSILE_SPEED, 2, delta);
      const target = run.drones.find((item) => item.id === missile.target);
      if (target) missile.dir = turnToward(missile.dir, normalize(sub(target.pos, missile.pos)), MISSILE_TURN * delta);
    }
    missile.pos = add(missile.pos, missile.dir, missile.speed * delta);
    if (missile.enemy) {
      if (length(sub(missile.pos, run.jet.pos)) < ENEMY_MISSILE_HIT) {
        missile.life = 0;
        endRun(run, 'missile');
      }
      continue;
    }
    const hit = run.drones.find((item) => length(sub(item.pos, missile.pos)) < MISSILE_HIT);
    if (hit) {
      missile.life = 0;
      shootDown(run, hit);
    }
  }
  run.missiles = run.missiles.filter((item) => item.life > 0);
}

function stepTargeting(run: JetRun, delta: number) {
  run.cooldown = Math.max(0, run.cooldown - delta);
  if (!currentTarget(run)) {
    run.targetId = nearestToNose(run)?.id ?? null;
    run.lock = 0;
  }
  const target = currentTarget(run);
  const inCone =
    target && noseAngle(run.jet, target.pos) < LOCK_CONE && length(sub(target.pos, run.jet.pos)) < LOCK_RANGE;
  run.lock = clamp(run.lock + (inCone ? delta / LOCK_TIME : -delta * 2), 0, 1);
}

export function stepJetRun(run: JetRun, delta: number, steer: Steer, random: () => number = Math.random) {
  if (run.status === 'countdown') {
    run.countdown -= delta;
    stepJet(run, NO_STEER, delta);
    if (run.countdown <= 0) run.status = 'running';
    return;
  }
  if (run.status !== 'running') return;
  run.time += delta;
  stepJet(run, steer, delta);
  if (run.jet.pos.y <= CRASH_ALTITUDE) {
    endRun(run, 'ocean');
    return;
  }
  stepDrones(run, delta, random);
  stepGun(run, steer.gun, delta, random);
  stepBullets(run, delta);
  stepMissiles(run, delta);
  if (run.status !== 'running') return;
  if (run.drones.some((item) => length(sub(item.pos, run.jet.pos)) < DRONE_COLLISION)) {
    endRun(run, 'collision');
    return;
  }
  if (run.drones.length < wantedDrones(run.score) && run.time >= run.nextSpawn) spawnDrone(run, random);
  stepTargeting(run, delta);
}

export function toggleJetPause(run: JetRun) {
  if (run.status === 'running') run.status = 'paused';
  else if (run.status === 'paused') run.status = 'running';
}
