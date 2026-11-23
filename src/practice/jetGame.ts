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
// Missiles ride on four pylons and come back one at a time, so she can't just spam them.
export const MAX_MISSILES = 4;
export const MISSILE_RELOAD = 4.5;
const FIRE_COOLDOWN = 0.5;
const MISSILE_SPEED = 340;
const MISSILE_TURN = 1.7;
const MISSILE_LIFE = 5.5;
const MISSILE_HIT = 20;
export const MISSILE_DAMAGE = 12;
// Once a target slips this far off the missile's nose, the seeker loses it and the missile flies on blind.
export const SEEKER_CONE = 0.75;
const GUN_GAP = 1 / 14;
export const BULLET_SPEED = 950;
const BULLET_LIFE = 0.85;
const BULLET_HIT = 17;
// Close aim counts, so the gun rewards tracking a target without needing pixel precision.
const GUN_ASSIST = 0.085;

export const MAX_HEALTH = 100;
// Flares refill each wave. Each drop pulls every missile already chasing her onto the flares.
export const FLARES = 3;
const FLARE_COOLDOWN = 1.2;
const FLARE_LIFE = 2.6;
const FLARE_DECOY_RANGE = 1300;
const ENEMY_FLARE_RANGE = 650;

// Enemy missiles are beatable: a hard turn makes them overshoot, and boosting nearly matches their speed.
export const ENEMY_MISSILE_SPEED = 220;
const ENEMY_MISSILE_TURN = 0.9;
const ENEMY_MISSILE_LIFE = 8;
const ENEMY_MISSILE_HIT = 12;
const ENEMY_SEEKER_CONE = 1.15;
const ENEMY_RANGE = 1000;
// Before an enemy fires a missile it locks on, which she hears and sees, so she has time to get ready.
export const ENEMY_LOCK_TIME = 1.4;
const ENEMY_GUN_RANGE = 620;
const ENEMY_GUN_CONE = 0.13;
const ENEMY_BURST = 0.8;
const ENEMY_GUN_GAP = 1 / 9;
export const ENEMY_BULLET_SPEED = 760;
const ENEMY_BULLET_LIFE = 1.05;
const ENEMY_SPREAD = 0.03;
const ENEMY_BULLET_HIT = 9;
export const ENEMY_BULLET_DAMAGE = 4;
const DRONE_COLLISION = 15;
const DRONE_LEASH = 2200;
const DRONE_LOW = 300;
const DRONE_HIGH = 1300;
const MAX_ALIVE = 5;
const QUEUE_GAP = 2.2;

export const WAVE_BREAK = 5;
const WAVE_HEAL = 35;
export const WAVE_BONUS = 300;
export const COMBO_TIME = 8;
export const MAX_COMBO = 4;

export type EnemyKind = 'drone' | 'fighter' | 'heavy' | 'ace';

export interface EnemySpec {
  speed: number;
  // Radians a second the enemy can swing its nose.
  turn: number;
  health: number;
  points: number;
  // How long she has to hold it near her nose for a missile lock.
  lockTime: number;
  flares: number;
  // The chance it drops a flare when one of her missiles gets close.
  flareChance: number;
  // The chance it breaks into a hard turn when one of her missiles is chasing it.
  evade: number;
  // Hunters chase her and use their guns. The rest cruise around and fire missiles from a distance.
  hunter: boolean;
  shotGap: number;
  burstGap: number;
}

export const ENEMIES: Record<EnemyKind, EnemySpec> = {
  drone: { speed: 85, turn: 0.45, health: 6, points: 100, lockTime: 0.6, flares: 0, flareChance: 0, evade: 0.35, hunter: false, shotGap: 11, burstGap: 0 },
  fighter: { speed: 132, turn: 0.8, health: 8, points: 250, lockTime: 0.9, flares: 1, flareChance: 0.6, evade: 0.8, hunter: true, shotGap: 15, burstGap: 3.2 },
  heavy: { speed: 72, turn: 0.28, health: 30, points: 400, lockTime: 0.75, flares: 2, flareChance: 1, evade: 0, hunter: false, shotGap: 8, burstGap: 0 },
  ace: { speed: 150, turn: 0.95, health: 18, points: 1000, lockTime: 1.2, flares: 3, flareChance: 0.9, evade: 1, hunter: true, shotGap: 10, burstGap: 2.6 },
};

// Five waves teach one new enemy each, ending on an ace. After that the cycle repeats, bigger and faster.
const WAVES: EnemyKind[][] = [
  ['drone', 'drone', 'drone', 'drone'],
  ['drone', 'drone', 'drone', 'fighter'],
  ['drone', 'fighter', 'drone', 'fighter'],
  ['drone', 'heavy', 'fighter', 'drone'],
  ['ace', 'fighter', 'drone', 'drone'],
];

export function waveRoster(wave: number): EnemyKind[] {
  const loop = Math.floor((wave - 1) / WAVES.length);
  const extra = Array.from({ length: Math.min(4, loop * 2) }, (_, i): EnemyKind => (i % 2 === 0 ? 'fighter' : 'drone'));
  return [...WAVES[(wave - 1) % WAVES.length], ...extra];
}

export const waveSpeed = (wave: number) => 1 + Math.min(0.24, Math.floor((wave - 1) / WAVES.length) * 0.08);
const maxEnemyMissiles = (wave: number) => Math.min(3, 1 + Math.floor(wave / 2));

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
  kind: EnemyKind;
  pos: Vec;
  dir: Vec;
  speed: number;
  // Where a cruising enemy wants to head next, as a compass angle.
  wantYaw: number;
  // How hard it's turning, for drawing its bank.
  bank: number;
  nextTurn: number;
  nextShot: number;
  // Seconds left until a missile launch, while it's locking on. Zero when it isn't.
  aim: number;
  nextBurst: number;
  burst: number;
  gunCooldown: number;
  health: number;
  flares: number;
  nextFlare: number;
  evadeUntil: number;
  nextEvadeRoll: number;
  evadeSide: number;
  breakUntil: number;
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
  // Her missiles chase this drone. Null means flying blind.
  target: number | null;
  // Set when a flare pulled the missile away.
  flare: number | null;
  // An enemy missile chases her until it loses track.
  tracking: boolean;
  enemy: boolean;
}

export interface Flare {
  id: number;
  pos: Vec;
  vel: Vec;
  life: number;
  enemy: boolean;
}

export type JetEvent =
  | { type: 'fired'; pos: Vec }
  | { type: 'enemy-fired'; pos: Vec }
  | { type: 'enemy-gun'; pos: Vec }
  | { type: 'drone-hit'; pos: Vec; heavy?: boolean }
  | { type: 'drone-down'; pos: Vec; kind: EnemyKind; points: number }
  | { type: 'hurt'; pos: Vec; amount: number }
  | { type: 'flares'; pos: Vec }
  | { type: 'enemy-flares'; pos: Vec }
  | { type: 'missile-lost'; pos: Vec; enemy: boolean }
  | { type: 'burst'; pos: Vec }
  | { type: 'wave-clear'; wave: number; bonus: number }
  | { type: 'wave-start'; wave: number; ace: boolean }
  | { type: 'crashed'; pos: Vec };

export type Ending = 'ocean' | 'missile' | 'collision' | 'gunned';

export interface JetRun {
  status: 'countdown' | 'running' | 'paused' | 'over';
  time: number;
  countdown: number;
  jet: Jet;
  health: number;
  lastHurt: number;
  drones: Drone[];
  missiles: Missile[];
  bullets: Bullet[];
  enemyBullets: Bullet[];
  flares: Flare[];
  score: number;
  kills: number;
  wave: number;
  // Seconds of calm left between waves. Zero during a fight.
  calm: number;
  queue: EnemyKind[];
  nextQueue: number;
  combo: number;
  comboTimer: number;
  bestCombo: number;
  targetId: number | null;
  lock: number;
  cooldown: number;
  missilesLeft: number;
  reload: number;
  flaresLeft: number;
  flareCooldown: number;
  gunCooldown: number;
  firing: boolean;
  nextPylon: number;
  nextId: number;
  ending: Ending | null;
  events: JetEvent[];
}

export const rightWing = (jet: Jet) => normalize(cross(jet.nose, jet.up));

// The compass direction of the nose. Flying straight up, the belly shows where she came from.
export function headingOf(jet: Jet) {
  const flat = Math.hypot(jet.nose.x, jet.nose.z) > 0.08 ? jet.nose : { ...jet.up, x: jet.up.x * Math.sign(-jet.nose.y), z: jet.up.z * Math.sign(-jet.nose.y) };
  return Math.atan2(flat.x, -flat.z);
}

export const yawOf = (dir: Vec) => Math.atan2(dir.x, -dir.z);
export const pitchOf = (dir: Vec) => Math.asin(clamp(dir.y, -1, 1));

function spawnDrone(run: JetRun, kind: EnemyKind, random: () => number) {
  const { jet } = run;
  const spec = ENEMIES[kind];
  // Aces show up straight ahead, so the big moment is easy to see.
  const bearing = headingOf(jet) + (random() - 0.5) * (kind === 'ace' ? 0.5 : 2.2);
  const range = (kind === 'ace' ? 1400 : 850) + random() * 500;
  const pos = add(jet.pos, direction(bearing, 0), range);
  pos.y = clamp(jet.pos.y + (random() - 0.5) * 240, DRONE_LOW, DRONE_HIGH);
  const yaw = spec.hunter ? bearing + Math.PI : random() * Math.PI * 2;
  // The first wave is a warm-up, so its missiles start late.
  const firstShot = spec.hunter ? 9 + random() * 4 : run.wave === 1 ? 12 + random() * 6 : 6 + random() * 5;
  run.drones.push({
    id: run.nextId,
    kind,
    pos,
    dir: direction(yaw, 0),
    speed: spec.speed * waveSpeed(run.wave),
    wantYaw: yaw,
    bank: 0,
    nextTurn: run.time + 2 + random() * 3,
    nextShot: run.time + firstShot,
    aim: 0,
    nextBurst: run.time + 3 + random() * 2,
    burst: 0,
    gunCooldown: 0,
    health: spec.health,
    flares: spec.flares,
    nextFlare: 0,
    evadeUntil: 0,
    nextEvadeRoll: 0,
    evadeSide: 1,
    breakUntil: 0,
  });
  run.nextId += 1;
}

function fillFromQueue(run: JetRun, random: () => number) {
  while (run.queue.length && run.drones.length < MAX_ALIVE) spawnDrone(run, run.queue.shift()!, random);
}

function startWave(run: JetRun, random: () => number) {
  run.queue = waveRoster(run.wave);
  run.events.push({ type: 'wave-start', wave: run.wave, ace: run.queue.includes('ace') });
  fillFromQueue(run, random);
  run.nextQueue = run.time + QUEUE_GAP;
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
    health: MAX_HEALTH,
    lastHurt: -Infinity,
    drones: [],
    missiles: [],
    bullets: [],
    enemyBullets: [],
    flares: [],
    score: 0,
    kills: 0,
    wave: 1,
    calm: 0,
    queue: [],
    nextQueue: 0,
    combo: 1,
    comboTimer: 0,
    bestCombo: 1,
    targetId: null,
    lock: 0,
    cooldown: 0,
    missilesLeft: MAX_MISSILES,
    reload: 0,
    flaresLeft: FLARES,
    flareCooldown: 0,
    gunCooldown: 0,
    firing: false,
    nextPylon: 1,
    nextId: 1,
    ending: null,
    events: [],
  };
  startWave(run, random);
  return run;
}

export const noseVector = (jet: Jet) => jet.nose;

export function noseAngle(jet: Jet, point: Vec) {
  return Math.acos(clamp(dot(noseVector(jet), normalize(sub(point, jet.pos))), -1, 1));
}

const angleBetween = (a: Vec, b: Vec) => Math.acos(clamp(dot(a, b), -1, 1));

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
// True while any enemy is locking a missile onto her.
export const beingLocked = (run: JetRun) => run.drones.some((item) => item.aim > 0);
// True while a hunter has her in its gun sight and is close enough to hit.
export const underGuns = (run: JetRun) => run.drones.some((item) => item.burst > 0);

// Where to point the gun so its rounds meet a moving drone.
export function leadPoint(run: JetRun, drone: Drone) {
  const flight = length(sub(drone.pos, run.jet.pos)) / (BULLET_SPEED + run.jet.speed);
  return add(drone.pos, drone.dir, drone.speed * flight);
}

export function fireMissile(run: JetRun) {
  if (run.status !== 'running' || run.cooldown > 0 || run.missilesLeft < 1) return;
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
    flare: null,
    tracking: false,
    enemy: false,
  });
  run.nextId += 1;
  run.missilesLeft -= 1;
  run.cooldown = FIRE_COOLDOWN;
  run.events.push({ type: 'fired', pos: run.jet.pos });
}

function addFlares(run: JetRun, at: Vec, heading: Vec, speed: number, enemy: boolean, random: () => number) {
  const ids: number[] = [];
  const side = enemy ? vec(heading.z, 0, -heading.x) : rightWing(run.jet);
  for (let i = 0; i < 4; i += 1) {
    const spread = (i % 2 === 0 ? 1 : -1) * (25 + random() * 30);
    const vel = add(add({ x: heading.x * speed * 0.35, y: heading.y * speed * 0.35 - 18, z: heading.z * speed * 0.35 }, side, spread), vec(0, 1, 0), -random() * 15);
    run.flares.push({ id: run.nextId, pos: add(at, heading, -8), vel, life: FLARE_LIFE + random() * 0.4, enemy });
    ids.push(run.nextId);
    run.nextId += 1;
  }
  return ids;
}

// She drops flares behind her, and every missile chasing her goes after them instead.
export function dropFlares(run: JetRun, random: () => number = Math.random) {
  if (run.status !== 'running' || run.flaresLeft < 1 || run.flareCooldown > 0) return;
  run.flaresLeft -= 1;
  run.flareCooldown = FLARE_COOLDOWN;
  const ids = addFlares(run, run.jet.pos, run.jet.nose, run.jet.speed, false, random);
  let pick = 0;
  for (const missile of run.missiles) {
    if (!missile.enemy || !missile.tracking || length(sub(missile.pos, run.jet.pos)) > FLARE_DECOY_RANGE) continue;
    missile.tracking = false;
    missile.flare = ids[pick % ids.length];
    pick += 1;
  }
  run.events.push({ type: 'flares', pos: { ...run.jet.pos } });
}

function enemyFlares(run: JetRun, drone: Drone, random: () => number) {
  drone.flares -= 1;
  const ids = addFlares(run, drone.pos, drone.dir, drone.speed, true, random);
  let pick = 0;
  for (const missile of run.missiles) {
    if (missile.enemy || missile.target !== drone.id || length(sub(missile.pos, drone.pos)) > ENEMY_FLARE_RANGE) continue;
    missile.target = null;
    missile.flare = ids[pick % ids.length];
    pick += 1;
  }
  run.events.push({ type: 'enemy-flares', pos: { ...drone.pos } });
}

function endRun(run: JetRun, ending: Ending) {
  run.status = 'over';
  run.ending = ending;
  run.health = Math.max(0, run.health);
  run.events.push({ type: 'crashed', pos: { ...run.jet.pos } });
}

function hurt(run: JetRun, amount: number, ending: Ending) {
  run.health -= amount;
  run.lastHurt = run.time;
  run.events.push({ type: 'hurt', pos: { ...run.jet.pos }, amount });
  if (run.health <= 0) endRun(run, ending);
}

function shootDown(run: JetRun, drone: Drone) {
  run.drones = run.drones.filter((item) => item !== drone);
  const points = ENEMIES[drone.kind].points * run.combo;
  run.score += points;
  run.kills += 1;
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  run.combo = Math.min(MAX_COMBO, run.combo + 1);
  run.comboTimer = COMBO_TIME;
  run.events.push({ type: 'drone-down', pos: drone.pos, kind: drone.kind, points });
}

function damage(run: JetRun, drone: Drone, amount: number, at: Vec) {
  drone.health -= amount;
  run.events.push({ type: 'drone-hit', pos: at, heavy: amount > 1 });
  if (drone.health <= 0) shootDown(run, drone);
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

// How close a point came to a round's path during one frame, because rounds cover many meters at a time.
function pathMiss(from: Vec, to: Vec, point: Vec) {
  const travel = sub(to, from);
  const span = dot(travel, travel) || 1;
  const along = clamp(dot(sub(point, from), travel) / span, 0, 1);
  return length(sub(point, add(from, travel, along)));
}

function stepBullets(run: JetRun, delta: number) {
  for (const bullet of run.bullets) {
    const from = bullet.pos;
    bullet.pos = add(bullet.pos, bullet.vel, delta);
    bullet.life -= delta;
    const hit = run.drones.find((drone) => pathMiss(from, bullet.pos, drone.pos) < BULLET_HIT);
    if (!hit) continue;
    bullet.life = 0;
    damage(run, hit, 1, bullet.pos);
  }
  run.bullets = run.bullets.filter((item) => item.life > 0);
}

function stepEnemyBullets(run: JetRun, delta: number) {
  for (const bullet of run.enemyBullets) {
    const from = bullet.pos;
    bullet.pos = add(bullet.pos, bullet.vel, delta);
    bullet.life -= delta;
    if (run.status !== 'running' || pathMiss(from, bullet.pos, run.jet.pos) >= ENEMY_BULLET_HIT) continue;
    bullet.life = 0;
    hurt(run, ENEMY_BULLET_DAMAGE, 'gunned');
  }
  run.enemyBullets = run.enemyBullets.filter((item) => item.life > 0);
}

// The nearest of her missiles that's still chasing this drone.
function incoming(run: JetRun, drone: Drone) {
  let best: Missile | undefined;
  let bestRange = Infinity;
  for (const missile of run.missiles) {
    if (missile.enemy || missile.target !== drone.id) continue;
    const range = length(sub(missile.pos, drone.pos));
    if (range < bestRange) {
      best = missile;
      bestRange = range;
    }
  }
  return best ? { missile: best, range: bestRange } : null;
}

function steerDrone(run: JetRun, drone: Drone, delta: number, random: () => number) {
  const spec = ENEMIES[drone.kind];
  const { jet } = run;
  const toJet = sub(jet.pos, drone.pos);
  const away = length(toJet);
  const threat = incoming(run, drone);
  let wanted: Vec;
  let turn = spec.turn;
  let speed = spec.speed * waveSpeed(run.wave);

  if (threat && threat.range < 480 && run.time > drone.nextEvadeRoll) {
    drone.nextEvadeRoll = run.time + 3;
    if (random() < spec.evade) {
      drone.evadeUntil = run.time + 2.4;
      drone.evadeSide = random() < 0.5 ? -1 : 1;
    }
  }
  if (threat && threat.range < 340 && drone.flares > 0 && run.time > drone.nextFlare) {
    drone.nextFlare = run.time + 1.5;
    if (random() < spec.flareChance) enemyFlares(run, drone, random);
  }

  if (run.time < drone.evadeUntil) {
    // A break turn: swing across the missile's path, which makes it hard for the missile to follow.
    const from = threat ? threat.missile.dir : drone.dir;
    const across = normalize(cross(from, vec(0, 1, 0)));
    wanted = normalize(add(vec(0, -0.15, 0), across, drone.evadeSide));
    turn *= 1.45;
  } else if (spec.hunter && away < 3200) {
    // Seconds until the two would meet, so a head-on pass breaks off early enough to miss her.
    const closing = dot(add({ x: jet.nose.x * jet.speed, y: jet.nose.y * jet.speed, z: jet.nose.z * jet.speed }, drone.dir, -drone.speed), normalize(sub(drone.pos, jet.pos)));
    const meet = closing > 1 ? away / closing : Infinity;
    if ((away < 180 || meet < 2.4) && run.time > drone.breakUntil) {
      drone.breakUntil = run.time + 1.8;
      drone.evadeSide = random() < 0.5 ? -1 : 1;
    }
    if (run.time < drone.breakUntil) {
      // Too close: swerve off to one side and climb instead of ramming her, then come back around.
      const across = normalize(cross(drone.dir, vec(0, 1, 0)));
      wanted = normalize(add(add(normalize(sub(drone.pos, jet.pos)), across, 1.6 * drone.evadeSide), vec(0, 0.6, 0)));
      turn *= 1.3;
    } else {
      // Aims where she'll be when its rounds arrive, which also puts it on her tail.
      const lead = add(jet.pos, jet.nose, jet.speed * (away / ENEMY_BULLET_SPEED));
      wanted = normalize(sub(lead, drone.pos));
    }
    const behind = dot(jet.nose, normalize(sub(drone.pos, jet.pos))) < -0.3;
    if (away > 750) speed *= 1.25;
    else if (behind && away < 380) speed = Math.min(speed, jet.speed * 0.95);
  } else {
    if (run.time > drone.nextTurn) {
      drone.wantYaw = yawOf(drone.dir) + (random() - 0.5) * 2.4;
      drone.nextTurn = run.time + 2 + random() * 3;
    }
    wanted = direction(drone.wantYaw, 0);
  }
  // Enemies keep clear of the water and of the thin air up high.
  if (drone.pos.y < DRONE_LOW * 0.45 && wanted.y < 0.25) wanted = normalize(vec(wanted.x, 0.35, wanted.z));
  else if (drone.pos.y < DRONE_LOW && wanted.y < 0) wanted = normalize(vec(wanted.x, 0.05, wanted.z));
  if (drone.pos.y > DRONE_HIGH && wanted.y > 0) wanted = normalize(vec(wanted.x, -0.15, wanted.z));

  const before = drone.dir;
  drone.dir = turnToward(drone.dir, wanted, turn * delta);
  const swing = cross(before, drone.dir).y;
  drone.bank = approach(drone.bank, clamp((-swing / Math.max(delta, 1e-4)) * 1.4, -1.2, 1.2), 4, delta);
  drone.speed = approach(drone.speed, speed, 1.2, delta);
  drone.pos = add(drone.pos, drone.dir, drone.speed * delta);
  return away;
}

function stepDrones(run: JetRun, delta: number, random: () => number) {
  let busy = run.missiles.filter((item) => item.enemy).length + run.drones.filter((item) => item.aim > 0).length;
  for (const drone of [...run.drones]) {
    const spec = ENEMIES[drone.kind];
    let away = steerDrone(run, drone, delta, random);
    if (away > DRONE_LEASH && (!spec.hunter || away > DRONE_LEASH * 1.5)) {
      // Far enemies come back around, so she never has to hunt for the fight.
      drone.pos = add(run.jet.pos, direction(headingOf(run.jet) + (random() - 0.5) * 2.2, 0), 1000);
      drone.pos.y = clamp(run.jet.pos.y, DRONE_LOW, DRONE_HIGH);
      away = 1000;
    }
    const toJet = sub(run.jet.pos, drone.pos);

    // Missiles: lock on for a moment, then fire, unless she gets out of range first.
    if (drone.aim > 0) {
      drone.aim -= delta;
      if (away > ENEMY_RANGE * 1.25) {
        drone.aim = 0;
        drone.nextShot = run.time + 3;
        busy -= 1;
      } else if (drone.aim <= 0) {
        drone.aim = 0;
        drone.nextShot = run.time + spec.shotGap * (0.8 + random() * 0.4);
        run.missiles.push({
          id: run.nextId,
          pos: { ...drone.pos },
          dir: normalize(toJet),
          speed: ENEMY_MISSILE_SPEED,
          life: ENEMY_MISSILE_LIFE,
          target: null,
          flare: null,
          tracking: true,
          enemy: true,
        });
        run.nextId += 1;
        run.events.push({ type: 'enemy-fired', pos: { ...drone.pos } });
      }
    } else if (run.time > drone.nextShot) {
      if (away < ENEMY_RANGE && busy < maxEnemyMissiles(run.wave)) {
        drone.aim = ENEMY_LOCK_TIME;
        busy += 1;
      } else drone.nextShot = run.time + 2;
    }

    // Guns: hunters fire short bursts when she's close and in front of them.
    if (!spec.hunter) continue;
    const inSight = away < ENEMY_GUN_RANGE && angleBetween(drone.dir, normalize(toJet)) < ENEMY_GUN_CONE;
    if (drone.burst <= 0 && inSight && run.time > drone.nextBurst) {
      drone.burst = ENEMY_BURST;
      drone.nextBurst = run.time + ENEMY_BURST + spec.burstGap;
      run.events.push({ type: 'enemy-gun', pos: { ...drone.pos } });
    }
    if (drone.burst <= 0) continue;
    drone.burst -= delta;
    drone.gunCooldown -= delta;
    while (drone.gunCooldown <= 0) {
      drone.gunCooldown += ENEMY_GUN_GAP;
      const lead = add(run.jet.pos, run.jet.nose, run.jet.speed * (away / ENEMY_BULLET_SPEED));
      const aim = turnToward(drone.dir, normalize(sub(lead, drone.pos)), ENEMY_GUN_CONE);
      const side = normalize(cross(aim, vec(0, 1, 0)));
      const spread = add(add(aim, side, (random() - 0.5) * ENEMY_SPREAD * 2), vec(0, 1, 0), (random() - 0.5) * ENEMY_SPREAD * 2);
      run.enemyBullets.push({
        pos: add(drone.pos, drone.dir, 10),
        vel: add({ x: drone.dir.x * drone.speed, y: drone.dir.y * drone.speed, z: drone.dir.z * drone.speed }, normalize(spread), ENEMY_BULLET_SPEED),
        life: ENEMY_BULLET_LIFE,
      });
    }
    if (drone.burst <= 0) drone.gunCooldown = 0;
  }
}

function turnToward(from: Vec, to: Vec, maxAngle: number) {
  const angle = Math.acos(clamp(dot(from, to), -1, 1));
  if (angle <= maxAngle || angle < 1e-4) return to;
  if (angle > Math.PI - 1e-3) {
    // Straight behind: pick a side to swing toward, so the turn has a direction.
    const side = Math.abs(from.y) < 0.9 ? normalize(cross(from, vec(0, 1, 0))) : vec(1, 0, 0);
    return rotate(from, normalize(cross(from, side)), maxAngle);
  }
  return normalize(add(from, sub(to, from), maxAngle / angle));
}

function stepFlares(run: JetRun, delta: number) {
  const drag = Math.exp(-0.9 * delta);
  for (const flare of run.flares) {
    flare.vel = { x: flare.vel.x * drag, y: flare.vel.y * drag - 28 * delta, z: flare.vel.z * drag };
    flare.pos = add(flare.pos, flare.vel, delta);
    flare.life -= delta;
  }
  run.flares = run.flares.filter((item) => item.life > 0);
}

function stepMissiles(run: JetRun, delta: number) {
  for (const missile of run.missiles) {
    missile.life -= delta;
    if (missile.flare !== null) {
      const flare = run.flares.find((item) => item.id === missile.flare);
      if (flare) {
        missile.dir = turnToward(missile.dir, normalize(sub(flare.pos, missile.pos)), 3 * delta);
        if (length(sub(flare.pos, missile.pos)) < 14) {
          missile.life = 0;
          run.events.push({ type: 'burst', pos: { ...missile.pos } });
        }
      } else missile.flare = null;
    } else if (missile.enemy && missile.tracking) {
      const toJet = normalize(sub(run.jet.pos, missile.pos));
      if (angleBetween(missile.dir, toJet) > ENEMY_SEEKER_CONE) {
        // She turned inside it, and it overshot.
        missile.tracking = false;
        run.events.push({ type: 'missile-lost', pos: { ...missile.pos }, enemy: true });
      } else missile.dir = turnToward(missile.dir, toJet, ENEMY_MISSILE_TURN * delta);
    } else if (!missile.enemy) {
      missile.speed = approach(missile.speed, MISSILE_SPEED, 2, delta);
      const target = run.drones.find((item) => item.id === missile.target);
      if (target) {
        const toTarget = normalize(sub(target.pos, missile.pos));
        if (angleBetween(missile.dir, toTarget) > SEEKER_CONE) {
          missile.target = null;
          run.events.push({ type: 'missile-lost', pos: { ...missile.pos }, enemy: false });
        } else missile.dir = turnToward(missile.dir, toTarget, MISSILE_TURN * delta);
      }
    }
    missile.pos = add(missile.pos, missile.dir, missile.speed * delta);
    if (missile.life <= 0) continue;
    if (missile.enemy) {
      if (missile.flare === null && length(sub(missile.pos, run.jet.pos)) < ENEMY_MISSILE_HIT && run.status === 'running') {
        missile.life = 0;
        // A missile hit is always the end of the flight, however much health is left.
        hurt(run, run.health, 'missile');
      }
      continue;
    }
    const hit = run.drones.find((item) => length(sub(item.pos, missile.pos)) < MISSILE_HIT);
    if (hit) {
      missile.life = 0;
      damage(run, hit, MISSILE_DAMAGE, missile.pos);
    }
  }
  run.missiles = run.missiles.filter((item) => item.life > 0);
}

function stepTargeting(run: JetRun, delta: number) {
  run.cooldown = Math.max(0, run.cooldown - delta);
  run.flareCooldown = Math.max(0, run.flareCooldown - delta);
  if (run.missilesLeft < MAX_MISSILES) {
    run.reload += delta;
    if (run.reload >= MISSILE_RELOAD) {
      run.reload = 0;
      run.missilesLeft += 1;
    }
  } else run.reload = 0;
  if (!currentTarget(run)) {
    run.targetId = nearestToNose(run)?.id ?? null;
    run.lock = 0;
  }
  const target = currentTarget(run);
  const inCone =
    target && noseAngle(run.jet, target.pos) < LOCK_CONE && length(sub(target.pos, run.jet.pos)) < LOCK_RANGE;
  const lockTime = target ? ENEMIES[target.kind].lockTime : 1;
  run.lock = clamp(run.lock + (inCone ? delta / lockTime : -delta * 2), 0, 1);
}

function stepWaves(run: JetRun, delta: number, random: () => number) {
  if (run.comboTimer > 0) {
    run.comboTimer -= delta;
    if (run.comboTimer <= 0) run.combo = 1;
  }
  if (run.calm > 0) {
    run.calm -= delta;
    if (run.calm <= 0) {
      run.calm = 0;
      startWave(run, random);
    }
    return;
  }
  if (run.queue.length && run.time >= run.nextQueue && run.drones.length < MAX_ALIVE) {
    spawnDrone(run, run.queue.shift()!, random);
    run.nextQueue = run.time + QUEUE_GAP;
  }
  if (run.drones.length || run.queue.length) return;
  // A cleared wave pays a bonus, patches her up, and refills her flares and missiles.
  const bonus = WAVE_BONUS * run.wave;
  run.score += bonus;
  run.events.push({ type: 'wave-clear', wave: run.wave, bonus });
  run.health = Math.min(MAX_HEALTH, run.health + WAVE_HEAL);
  run.flaresLeft = FLARES;
  run.missilesLeft = MAX_MISSILES;
  run.reload = 0;
  run.wave += 1;
  run.calm = WAVE_BREAK;
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
  stepFlares(run, delta);
  stepMissiles(run, delta);
  stepEnemyBullets(run, delta);
  if (run.status !== 'running') return;
  if (run.drones.some((item) => length(sub(item.pos, run.jet.pos)) < DRONE_COLLISION)) {
    endRun(run, 'collision');
    return;
  }
  stepWaves(run, delta, random);
  stepTargeting(run, delta);
}

export function toggleJetPause(run: JetRun) {
  if (run.status === 'running') run.status = 'paused';
  else if (run.status === 'paused') run.status = 'running';
}
