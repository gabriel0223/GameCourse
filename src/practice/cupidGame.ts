// Love Attack: pure rules with no drawing or input, so the game can be tested without a browser.
// The arena is flat. x runs left to right on screen, and z runs from the back of the arena to the front.

export interface Flat {
  x: number;
  z: number;
}

export const ARENA_W = 10;
export const ARENA_D = 5.6;
export const COUNTDOWN = 3;
// One mistake ends the run. Raise this to give her more hearts, and the HUD shows them.
export const MAX_HP = 1;

// Movement
const MOVE_SPEED = 6;
const DRAW_SPEED = 3.2;
const DASH_SPEED = 21;
export const DASH_TIME = 0.16;
const DASH_COOLDOWN = 0.55;
// From the start of one dash to the next.
export const DASH_RECHARGE = DASH_TIME + DASH_COOLDOWN;
const HURT_GRACE = 1.3;
const PLAYER_RADIUS = 0.45;

// The bow. Holding longer makes a faster, stronger arrow, and a full draw also pierces.
export const FULL_DRAW = 0.55;
const RELEASE_GAP = 0.12;
const ARROW_LIFE = 1.1;
const ARROW_RADIUS = 0.3;
// On a controller, an arrow bends toward an enemy this close to the aim line.
const ASSIST_ANGLE = (8 * Math.PI) / 180;

// Combo
export const COMBO_STEP = 3;
export const MAX_COMBO = 8;

// Teddy plushies are the score. Each one cashes in the combo, then the combo starts over.
export const PLUSHIE_POINTS = 100;
export const PLUSHIE_LIFE = 10;
const PLUSHIE_RADIUS = 0.5;
// Generous on purpose: brushing past a plushie is enough to grab it.
const GRAB_RADIUS = 1.35;
const PLUSHIE_GAP = 1.2;
const SPAWN_TIME = 0.9;

export type EnemyKind = 'puff' | 'spitter' | 'storm';

interface KindRules {
  hp: number;
  radius: number;
}

export const KINDS: Record<EnemyKind, KindRules> = {
  puff: { hp: 1, radius: 0.65 },
  spitter: { hp: 2, radius: 0.7 },
  storm: { hp: 6, radius: 1.25 },
};

export interface Player {
  pos: Flat;
  face: Flat;
  moving: number;
  hp: number;
  draw: number;
  drawing: boolean;
  releaseReady: number;
  hurtUntil: number;
  dashUntil: number;
  dashReady: number;
  dashDir: Flat;
}

export interface Arrow {
  id: number;
  pos: Flat;
  dir: Flat;
  speed: number;
  damage: number;
  pierce: boolean;
  full: boolean;
  life: number;
  hits: number[];
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Flat;
  hp: number;
  // Counts down while the shadow grows. An enemy can't hurt or be hit until it lands.
  spawning: number;
  // Spitters wind up before they spit, so there's always time to react.
  windup: number;
  cooldown: number;
  flash: number;
  seed: number;
}

export interface Drop {
  id: number;
  pos: Flat;
  vel: Flat;
  life: number;
}

export interface Plushie {
  id: number;
  pos: Flat;
  life: number;
}

export type Ending = 'bumped' | 'rain' | 'plushie';

export type CupidEvent =
  | { type: 'shot'; power: number; full: boolean }
  | { type: 'drawFull' }
  | { type: 'hit'; at: Flat; kind: EnemyKind }
  | { type: 'pop'; at: Flat; kind: EnemyKind }
  | { type: 'miss' }
  | { type: 'hurt'; at: Flat }
  | { type: 'plushieHit'; at: Flat }
  | { type: 'plushie'; at: Flat }
  | { type: 'plushieGone'; at: Flat }
  | { type: 'grab'; at: Flat; points: number; combo: number }
  | { type: 'dash' }
  | { type: 'spit'; at: Flat }
  | { type: 'combo'; level: number }
  | { type: 'comboLost' }
  | { type: 'over' };

export interface CupidInput {
  // Up to length 1.
  move: Flat;
  // A direction to aim, or null to keep the last one.
  aim: Flat | null;
  drawing: boolean;
  dash: boolean;
  // Light aim help for thumbsticks. A mouse doesn't need it.
  assist: boolean;
}

export interface CupidRun {
  status: 'countdown' | 'running' | 'paused' | 'over';
  time: number;
  countdown: number;
  score: number;
  // Counts down to the next cloud, and to the next big storm.
  spawnTimer: number;
  stormTimer: number;
  combo: number;
  comboProgress: number;
  bestCombo: number;
  shots: number;
  landed: number;
  pops: number;
  player: Player;
  arrows: Arrow[];
  enemies: Enemy[];
  drops: Drop[];
  plushies: Plushie[];
  // Counts down to the next plushie.
  plushieTimer: number;
  grabbed: number;
  ending: Ending | null;
  nextId: number;
  events: CupidEvent[];
}

// Small vector helpers
export const lengthOf = (v: Flat) => Math.hypot(v.x, v.z);
export const minus = (a: Flat, b: Flat): Flat => ({ x: a.x - b.x, z: a.z - b.z });
export const distance = (a: Flat, b: Flat) => lengthOf(minus(a, b));
export function unit(v: Flat): Flat {
  const size = lengthOf(v);
  return size > 1e-6 ? { x: v.x / size, z: v.z / size } : { x: 0, z: 0 };
}
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function newCupidRun(): CupidRun {
  return {
    status: 'countdown',
    time: 0,
    countdown: COUNTDOWN,
    score: 0,
    spawnTimer: 1,
    stormTimer: STORM_FIRST,
    combo: 1,
    comboProgress: 0,
    bestCombo: 1,
    shots: 0,
    landed: 0,
    pops: 0,
    player: {
      pos: { x: 0, z: 1 },
      // A three-quarter turn toward the camera, so the start shows her face.
      face: { x: 0.8, z: 0.6 },
      moving: 0,
      hp: MAX_HP,
      draw: 0,
      drawing: false,
      releaseReady: 0,
      hurtUntil: 0,
      dashUntil: 0,
      dashReady: 0,
      dashDir: { x: 0, z: -1 },
    },
    arrows: [],
    enemies: [],
    drops: [],
    plushies: [],
    plushieTimer: 0.8,
    grabbed: 0,
    ending: null,
    nextId: 1,
    events: [],
  };
}

// There are no waves. Everything ramps up smoothly with the time she has survived.
const STORM_FIRST = 45;
const STORM_GAP = 50;
// Seconds between clouds: 2.2 at the start, down to 0.6 after about a minute and a half.
export const spawnGap = (time: number) => Math.max(0.6, 2.2 * 0.985 ** time);
// How many clouds can be in the arena at once.
export const cloudLimit = (time: number) => Math.min(16, 3 + Math.floor(time / 12));
// Spitters start showing up after 30 seconds and become more common, up to one in four.
export const spitterChance = (time: number) => Math.max(0, Math.min(0.25, (time - 30) / 200));
const speedUp = (time: number) => Math.min(1.4, time * 0.011);

export const isDashing = (run: CupidRun) => run.time < run.player.dashUntil;
export const isGuarded = (run: CupidRun) => isDashing(run) || run.time < run.player.hurtUntil;
export const drawPower = (player: Player) => clamp(player.draw / FULL_DRAW, 0, 1);
export const accuracy = (run: CupidRun) => (run.shots ? Math.round((run.landed / run.shots) * 100) : 0);

function spawnPoint(run: CupidRun, random: () => number): Flat {
  // Somewhere along the edge, never right on top of her.
  for (let tries = 0; tries < 12; tries += 1) {
    const side = Math.floor(random() * 4);
    const along = random() * 2 - 1;
    const inset = 1.2;
    const point =
      side === 0
        ? { x: along * (ARENA_W - inset), z: -ARENA_D + inset }
        : side === 1
          ? { x: along * (ARENA_W - inset), z: ARENA_D - inset }
          : side === 2
            ? { x: -ARENA_W + inset, z: along * (ARENA_D - inset) }
            : { x: ARENA_W - inset, z: along * (ARENA_D - inset) };
    if (distance(point, run.player.pos) > 5) return point;
  }
  return { x: run.player.pos.x > 0 ? -ARENA_W + 1.2 : ARENA_W - 1.2, z: 0 };
}

function spawnEnemy(run: CupidRun, kind: EnemyKind, at: Flat, random: () => number, spawning = SPAWN_TIME) {
  run.enemies.push({
    id: run.nextId,
    kind,
    pos: { ...at },
    hp: KINDS[kind].hp,
    spawning,
    windup: 0,
    cooldown: 1.5 + random() * 1.5,
    flash: 0,
    seed: random() * 100,
  });
  run.nextId += 1;
}

function endRun(run: CupidRun, ending: Ending) {
  run.status = 'over';
  run.ending = ending;
  run.events.push({ type: 'over' });
}

function hurtPlayer(run: CupidRun, from: Flat, ending: Ending) {
  const player = run.player;
  if (isGuarded(run) || run.status !== 'running') return;
  player.hp -= 1;
  player.hurtUntil = run.time + HURT_GRACE;
  // A small shove away from whatever hit her.
  const away = unit(minus(player.pos, from));
  player.pos.x = clamp(player.pos.x + away.x * 1.1, -ARENA_W, ARENA_W);
  player.pos.z = clamp(player.pos.z + away.z * 1.1, -ARENA_D, ARENA_D);
  run.events.push({ type: 'hurt', at: { ...player.pos } });
  if (run.combo > 1 || run.comboProgress > 0) run.events.push({ type: 'comboLost' });
  run.combo = 1;
  run.comboProgress = 0;
  if (player.hp <= 0) endRun(run, ending);
}

function fire(run: CupidRun, assist: boolean) {
  const player = run.player;
  const power = drawPower(player);
  const full = power >= 1;
  let dir = { ...player.face };
  if (assist) {
    // Picks the closest enemy near the aim line and points straight at it.
    let best: { dir: Flat; angle: number } | null = null;
    for (const enemy of run.enemies) {
      if (enemy.spawning > 0) continue;
      const toward = unit(minus(enemy.pos, player.pos));
      const angle = Math.acos(clamp(toward.x * dir.x + toward.z * dir.z, -1, 1));
      if (angle < ASSIST_ANGLE && (!best || angle < best.angle)) best = { dir: toward, angle };
    }
    if (best) dir = best.dir;
  }
  run.arrows.push({
    id: run.nextId,
    pos: { x: player.pos.x + dir.x * 0.5, z: player.pos.z + dir.z * 0.5 },
    dir,
    speed: full ? 26 : 11 + 11 * power,
    damage: full ? 3 : power >= 0.5 ? 2 : 1,
    pierce: full,
    full,
    life: ARROW_LIFE,
    hits: [],
  });
  run.nextId += 1;
  run.shots += 1;
  run.events.push({ type: 'shot', power, full });
}

function popEnemy(run: CupidRun, enemy: Enemy, random: () => number) {
  run.pops += 1;
  run.events.push({ type: 'pop', at: { ...enemy.pos }, kind: enemy.kind });
  // A big storm breaks into two small clouds.
  if (enemy.kind === 'storm') {
    for (const side of [-1, 1]) {
      spawnEnemy(run, 'puff', { x: clamp(enemy.pos.x + side * 1.2, -ARENA_W, ARENA_W), z: enemy.pos.z }, random, 0.25);
    }
  }
  // Pops build the combo, and the next plushie cashes it in.
  run.comboProgress += 1;
  if (run.comboProgress >= COMBO_STEP && run.combo < MAX_COMBO) {
    run.combo += 1;
    run.comboProgress = 0;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    run.events.push({ type: 'combo', level: run.combo });
  } else if (run.combo >= MAX_COMBO) {
    run.comboProgress = Math.min(run.comboProgress, COMBO_STEP);
  }
}

function stepPlayer(run: CupidRun, input: CupidInput, delta: number) {
  const player = run.player;
  if (input.aim && lengthOf(input.aim) > 0.01) player.face = unit(input.aim);

  // Drawing and releasing the bow.
  if (input.drawing && run.time >= player.releaseReady) {
    const before = drawPower(player);
    player.drawing = true;
    player.draw += delta;
    if (before < 1 && drawPower(player) >= 1) run.events.push({ type: 'drawFull' });
  } else if (!input.drawing && player.drawing) {
    fire(run, input.assist);
    player.drawing = false;
    player.draw = 0;
    player.releaseReady = run.time + RELEASE_GAP;
  }

  const move = lengthOf(input.move) > 1 ? unit(input.move) : input.move;
  if (input.dash && run.time >= player.dashReady) {
    const size = lengthOf(move);
    player.dashDir = size > 0.2 ? unit(move) : { ...player.face };
    player.dashUntil = run.time + DASH_TIME;
    player.dashReady = run.time + DASH_RECHARGE;
    run.events.push({ type: 'dash' });
  }

  let velocity: Flat;
  if (isDashing(run)) {
    velocity = { x: player.dashDir.x * DASH_SPEED, z: player.dashDir.z * DASH_SPEED };
  } else {
    const speed = player.drawing ? DRAW_SPEED : MOVE_SPEED;
    velocity = { x: move.x * speed, z: move.z * speed };
  }
  player.moving = lengthOf(velocity);
  player.pos.x = clamp(player.pos.x + velocity.x * delta, -ARENA_W, ARENA_W);
  player.pos.z = clamp(player.pos.z + velocity.z * delta, -ARENA_D, ARENA_D);
}

function stepEnemies(run: CupidRun, delta: number, random: () => number) {
  const player = run.player;
  const faster = speedUp(run.time);
  for (const enemy of run.enemies) {
    enemy.flash = Math.max(0, enemy.flash - delta);
    if (enemy.spawning > 0) {
      enemy.spawning -= delta;
      continue;
    }
    const toward = minus(player.pos, enemy.pos);
    const dir = unit(toward);
    const wobble = Math.sin(run.time * 2.3 + enemy.seed) * 0.35;
    const side = { x: -dir.z, z: dir.x };
    if (enemy.kind === 'spitter') {
      // Keeps its distance and circles, then winds up and spits a slow raindrop.
      const gap = lengthOf(toward);
      const push = gap < 4.5 ? -1 : gap > 6.5 ? 1 : 0;
      const speed = 2 + faster * 0.5;
      enemy.pos.x += (dir.x * push * 0.8 + side.x * 0.6) * speed * delta;
      enemy.pos.z += (dir.z * push * 0.8 + side.z * 0.6) * speed * delta;
      if (enemy.windup > 0) {
        enemy.windup -= delta;
        if (enemy.windup <= 0) {
          run.drops.push({ id: run.nextId, pos: { ...enemy.pos }, vel: { x: dir.x * 5, z: dir.z * 5 }, life: 4 });
          run.nextId += 1;
          enemy.cooldown = 2.6 + random() * 1.4;
        }
      } else {
        enemy.cooldown -= delta;
        if (enemy.cooldown <= 0) {
          enemy.windup = 0.8;
          run.events.push({ type: 'spit', at: { ...enemy.pos } });
        }
      }
    } else {
      const speed = enemy.kind === 'storm' ? 1.4 + faster * 0.4 : 2.2 + faster;
      enemy.pos.x += (dir.x + side.x * wobble) * speed * delta;
      enemy.pos.z += (dir.z + side.z * wobble) * speed * delta;
    }
    enemy.pos.x = clamp(enemy.pos.x, -ARENA_W - 0.5, ARENA_W + 0.5);
    enemy.pos.z = clamp(enemy.pos.z, -ARENA_D - 0.5, ARENA_D + 0.5);
  }

  // Clouds nudge each other apart, so a crowd stays readable.
  const live = run.enemies.filter((enemy) => enemy.spawning <= 0);
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];
      const gap = minus(a.pos, b.pos);
      const size = lengthOf(gap);
      const room = KINDS[a.kind].radius + KINDS[b.kind].radius;
      if (size < room && size > 1e-4) {
        const push = ((room - size) / 2) * Math.min(1, delta * 10);
        a.pos.x += (gap.x / size) * push;
        a.pos.z += (gap.z / size) * push;
        b.pos.x -= (gap.x / size) * push;
        b.pos.z -= (gap.z / size) * push;
      }
    }
  }

  for (const enemy of live) {
    if (distance(enemy.pos, player.pos) < KINDS[enemy.kind].radius + PLAYER_RADIUS) hurtPlayer(run, enemy.pos, 'bumped');
  }
}

function stepArrows(run: CupidRun, delta: number, random: () => number) {
  const kept: Arrow[] = [];
  for (const arrow of run.arrows) {
    arrow.pos.x += arrow.dir.x * arrow.speed * delta;
    arrow.pos.z += arrow.dir.z * arrow.speed * delta;
    arrow.life -= delta;
    let spent = false;
    // An arrow that touches a plushie ends the run, even a piercing one.
    const plushie = run.plushies.find((item) => distance(arrow.pos, item.pos) < PLUSHIE_RADIUS + ARROW_RADIUS);
    if (plushie) {
      run.events.push({ type: 'plushieHit', at: { ...plushie.pos } });
      endRun(run, 'plushie');
      kept.push(arrow);
      run.arrows = kept;
      return;
    }
    for (const enemy of run.enemies) {
      if (enemy.spawning > 0 || enemy.hp <= 0 || arrow.hits.includes(enemy.id)) continue;
      if (distance(arrow.pos, enemy.pos) > KINDS[enemy.kind].radius + ARROW_RADIUS) continue;
      arrow.hits.push(enemy.id);
      enemy.hp -= arrow.damage;
      enemy.flash = 0.12;
      if (arrow.hits.length === 1) run.landed += 1;
      if (enemy.hp <= 0) popEnemy(run, enemy, random);
      else run.events.push({ type: 'hit', at: { ...enemy.pos }, kind: enemy.kind });
      if (!arrow.pierce) {
        spent = true;
        break;
      }
    }
    const outside = Math.abs(arrow.pos.x) > ARENA_W + 3 || Math.abs(arrow.pos.z) > ARENA_D + 3;
    if (!spent && (arrow.life <= 0 || outside)) {
      spent = true;
      if (!arrow.hits.length) {
        // A miss clears progress toward the next combo step, but keeps the step she's on.
        run.comboProgress = 0;
        run.events.push({ type: 'miss' });
      }
    }
    if (!spent) kept.push(arrow);
  }
  run.arrows = kept;
  run.enemies = run.enemies.filter((enemy) => enemy.hp > 0);
}

function stepDrops(run: CupidRun, delta: number) {
  const kept: Drop[] = [];
  for (const drop of run.drops) {
    drop.pos.x += drop.vel.x * delta;
    drop.pos.z += drop.vel.z * delta;
    drop.life -= delta;
    if (distance(drop.pos, run.player.pos) < 0.3 + PLAYER_RADIUS && !isGuarded(run)) {
      hurtPlayer(run, drop.pos, 'rain');
      continue;
    }
    if (drop.life > 0 && Math.abs(drop.pos.x) < ARENA_W + 2 && Math.abs(drop.pos.z) < ARENA_D + 2) kept.push(drop);
  }
  run.drops = kept;
}

function plushieSpot(run: CupidRun, random: () => number): Flat {
  // Somewhere open, not right next to her or inside a cloud.
  let best: Flat = { x: 0, z: 0 };
  let bestRoom = -1;
  for (let tries = 0; tries < 16; tries += 1) {
    const spot = { x: (random() * 2 - 1) * (ARENA_W - 1.5), z: (random() * 2 - 1) * (ARENA_D - 1.2) };
    const room = Math.min(
      distance(spot, run.player.pos) - 3,
      ...run.enemies.map((enemy) => distance(spot, enemy.pos) - KINDS[enemy.kind].radius - PLUSHIE_GAP),
      ...run.plushies.map((item) => distance(spot, item.pos) - 3),
    );
    if (room > 0) return spot;
    if (room > bestRoom) {
      best = spot;
      bestRoom = room;
    }
  }
  return best;
}

export const plushieLimit = (time: number) => (time >= 75 ? 2 : 1);

function stepPlushies(run: CupidRun, delta: number, random: () => number) {
  const player = run.player;
  const kept: Plushie[] = [];
  for (const plushie of run.plushies) {
    plushie.life -= delta;
    if (distance(plushie.pos, player.pos) < GRAB_RADIUS) {
      const points = PLUSHIE_POINTS * run.combo;
      run.score += points;
      run.grabbed += 1;
      run.events.push({ type: 'grab', at: { ...plushie.pos }, points, combo: run.combo });
      run.combo = 1;
      run.comboProgress = 0;
      continue;
    }
    if (plushie.life <= 0) {
      run.events.push({ type: 'plushieGone', at: { ...plushie.pos } });
      continue;
    }
    kept.push(plushie);
  }
  if (kept.length < run.plushies.length) run.plushieTimer = Math.max(run.plushieTimer, 1.2);
  run.plushies = kept;
  if (run.plushies.length < plushieLimit(run.time)) {
    run.plushieTimer -= delta;
    if (run.plushieTimer <= 0) {
      const at = plushieSpot(run, random);
      run.plushies.push({ id: run.nextId, pos: at, life: PLUSHIE_LIFE });
      run.nextId += 1;
      run.plushieTimer = 1.2;
      run.events.push({ type: 'plushie', at: { ...at } });
    }
  }
}

function stepSpawns(run: CupidRun, delta: number, random: () => number) {
  run.stormTimer -= delta;
  if (run.stormTimer <= 0) {
    spawnEnemy(run, 'storm', spawnPoint(run, random), random);
    run.stormTimer = STORM_GAP;
  }
  run.spawnTimer -= delta;
  if (run.spawnTimer > 0) return;
  // When the arena is full, the next cloud waits for room.
  if (run.enemies.length >= cloudLimit(run.time)) {
    run.spawnTimer = 0.25;
    return;
  }
  const kind: EnemyKind = random() < spitterChance(run.time) ? 'spitter' : 'puff';
  spawnEnemy(run, kind, spawnPoint(run, random), random);
  run.spawnTimer = spawnGap(run.time);
}

export function stepCupidRun(run: CupidRun, input: CupidInput, delta: number, random: () => number = Math.random) {
  if (run.status === 'countdown') {
    run.countdown -= delta;
    // She can look around and aim during the countdown, but nothing moves yet.
    if (input.aim && lengthOf(input.aim) > 0.01) run.player.face = unit(input.aim);
    if (run.countdown <= 0) run.status = 'running';
    return;
  }
  if (run.status !== 'running') return;
  run.time += delta;
  stepPlayer(run, input, delta);
  stepSpawns(run, delta, random);
  stepEnemies(run, delta, random);
  if (run.status !== 'running') return;
  stepArrows(run, delta, random);
  if (run.status !== 'running') return;
  stepDrops(run, delta);
  if (run.status !== 'running') return;
  stepPlushies(run, delta, random);
}

export function toggleCupidPause(run: CupidRun) {
  if (run.status === 'running') run.status = 'paused';
  else if (run.status === 'paused') run.status = 'running';
}
