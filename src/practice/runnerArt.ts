import fujiUrl from '../assets/runner/fuji.png';
import obstaclesUrl from '../assets/runner/obstacles.png';
import roadUrl from '../assets/runner/road.png';
import skyUrl from '../assets/runner/sky.png';
import streetUrl from '../assets/runner/street.png';
import townUrl from '../assets/runner/town.png';
import { strings } from '../strings';
import type { Control, Device } from './devices';
import { PLAYER_X, currentTarget, hopProgress } from './runnerGame';
import type { Obstacle, RunEvent, RunState } from './runnerGame';

// The world is drawn in pixel units on a 320 x 180 stage, then scaled up.
export const STAGE_W = 320;
export const STAGE_H = 180;
const GROUND = 134;
const FONT = '"Sora Variable", "Figtree Variable", sans-serif';
const SPRITE_W = 16;
const SPRITE_H = 22;
const SPRITE_SCALE = 2;
const WALK = [0, 1, 2, 3];
const t = strings.practice;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Fx {
  particles: Particle[];
  message: { text: string; until: number; color: string } | null;
  shake: number;
}

export const newFx = (): Fx => ({ particles: [], message: null, shake: 0 });

export function applyEvents(fx: Fx, events: RunEvent[], time: number) {
  for (const event of events) {
    if (event.type === 'cleared') {
      for (let i = 0; i < 14; i += 1) {
        const angle = (i / 14) * Math.PI * 2;
        const speed = 30 + (i % 4) * 22;
        fx.particles.push({
          x: event.x,
          y: GROUND - 54,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 18,
          life: 0.5,
          color: i % 3 ? event.color : '#FFC857',
        });
      }
    } else if (event.type === 'crashed') {
      fx.shake = 0.28;
    } else if (event.type === 'wrong') {
      fx.message = { text: t.wrong(event.pressed.name, event.pressed.kind === 'key'), until: time + 0.9, color: '#F0708A' };
    } else {
      fx.message = { text: t.newButtons, until: time + 1.4, color: '#FFC857' };
    }
  }
  events.length = 0;
}

function stepParticles(fx: Fx, delta: number) {
  for (const item of fx.particles) {
    item.x += item.vx * delta;
    item.y += item.vy * delta;
    item.vy += 160 * delta;
    item.life -= delta;
  }
  fx.particles = fx.particles.filter((item) => item.life > 0);
  fx.shake = Math.max(0, fx.shake - delta);
}

function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

export interface World {
  sky: HTMLImageElement;
  fuji: HTMLImageElement;
  town: HTMLImageElement;
  street: HTMLImageElement;
  road: HTMLImageElement;
  obstacles: HTMLImageElement;
}

function image(url: string) {
  const item = new Image();
  item.src = url;
  return item;
}

export const loadWorld = (): World => ({
  sky: image(skyUrl),
  fuji: image(fujiUrl),
  town: image(townUrl),
  street: image(streetUrl),
  road: image(roadUrl),
  obstacles: image(obstaclesUrl),
});

function scroll(c: CanvasRenderingContext2D, layer: HTMLImageElement, distance: number, y: number) {
  if (!layer.complete || !layer.naturalWidth) return;
  const width = layer.naturalWidth;
  const x = -Math.round(distance % width);
  c.drawImage(layer, x, y);
  c.drawImage(layer, x + width, y);
}

// Fixed starting spots, so petals drift the same way on every run.
const PETALS = Array.from({ length: 16 }, (_, i) => {
  const hash = (seed: number) => Math.abs(Math.sin(i * 12.9898 + seed) * 43758.5453) % 1;
  return { x: hash(1) * STAGE_W, y: hash(7) * GROUND, sway: hash(3) * 6, wide: i % 3 === 0 };
});

function drawPetals(c: CanvasRenderingContext2D, run: RunState) {
  const span = STAGE_W + 20;
  for (const petal of PETALS) {
    const fall = run.time * 16 + run.countdown * 4;
    const x = (((petal.x - run.distance * 0.7 - fall * 0.8) % span) + span) % span;
    const y = (petal.y + fall) % (GROUND + 8);
    rect(c, x - 10, y + Math.sin(fall / 9 + petal.sway) * 3, petal.wide ? 3 : 2, 2, petal.wide ? 'rgba(233, 196, 214, 0.55)' : 'rgba(214, 150, 180, 0.5)');
  }
}

function drawWorld(c: CanvasRenderingContext2D, world: World, distance: number) {
  rect(c, 0, 0, STAGE_W, GROUND, '#3D1F63');
  if (world.sky.complete) c.drawImage(world.sky, 0, 0);
  scroll(c, world.fuji, 120 + distance * 0.03, 0);
  scroll(c, world.town, distance * 0.12, 0);
  scroll(c, world.street, distance * 0.45, 0);
  rect(c, 0, GROUND, STAGE_W, STAGE_H - GROUND, '#2B2535');
  scroll(c, world.road, distance, GROUND);
}

const OBSTACLE_W = 28;
const OBSTACLE_H = 32;

function drawObstacle(c: CanvasRenderingContext2D, world: World, item: Obstacle) {
  if (!world.obstacles.complete) return;
  const x = Math.round(item.x) - OBSTACLE_W / 2;
  rect(c, x + 4, GROUND, OBSTACLE_W - 8, 2, 'rgba(10, 7, 20, 0.5)');
  c.drawImage(
    world.obstacles,
    (item.id % 4) * OBSTACLE_W,
    0,
    OBSTACLE_W,
    OBSTACLE_H,
    x,
    GROUND - OBSTACLE_H,
    OBSTACLE_W,
    OBSTACLE_H,
  );
}

function drawGlyph(c: CanvasRenderingContext2D, control: Control, x: number, y: number, size: number, device: Device, color: string) {
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = size * 0.17;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const r = size * 0.55;
  if (control.kind === 'face' && device.id === 'playstation') {
    c.beginPath();
    if (control.id === 'cross') {
      c.moveTo(x - r, y - r);
      c.lineTo(x + r, y + r);
      c.moveTo(x + r, y - r);
      c.lineTo(x - r, y + r);
    } else if (control.id === 'circle') {
      c.arc(x, y, r, 0, Math.PI * 2);
    } else if (control.id === 'square') {
      c.rect(x - r, y - r, r * 2, r * 2);
    } else {
      c.moveTo(x, y - r * 1.15);
      c.lineTo(x + r * 1.15, y + r * 0.8);
      c.lineTo(x - r * 1.15, y + r * 0.8);
      c.closePath();
    }
    c.stroke();
    return;
  }
  if (control.kind === 'dpad') {
    const direction = control.id.split('-')[1];
    const turn = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[direction] ?? 0;
    c.save();
    c.translate(x, y);
    c.rotate(turn);
    c.beginPath();
    c.moveTo(0, -r * 1.1);
    c.lineTo(r, r * 0.1);
    c.lineTo(r * 0.36, r * 0.1);
    c.lineTo(r * 0.36, r);
    c.lineTo(-r * 0.36, r);
    c.lineTo(-r * 0.36, r * 0.1);
    c.lineTo(-r, r * 0.1);
    c.closePath();
    c.fill();
    c.restore();
    return;
  }
  const long = control.label.length;
  c.font = `700 ${long > 3 ? size * 0.62 : long > 1 ? size * 0.9 : size * 1.25}px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(control.label, x, y + size * 0.06);
}

function drawCheck(c: CanvasRenderingContext2D, x: number) {
  const y = GROUND - 42;
  c.fillStyle = '#14101F';
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#5FD0B6';
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - 3, y);
  c.lineTo(x - 1, y + 2.5);
  c.lineTo(x + 3.5, y - 2.5);
  c.stroke();
}

function badgePath(c: CanvasRenderingContext2D, control: Control, x: number, y: number, radius: number) {
  const wide = control.kind === 'key' && control.label.length > 2;
  c.beginPath();
  if (wide || control.kind === 'shoulder' || control.kind === 'key') {
    const half = radius * (wide ? 1.6 : 1);
    c.roundRect(x - half, y - radius, half * 2, radius * 2, 5);
  } else {
    c.arc(x, y, radius, 0, Math.PI * 2);
  }
}

function drawPrompt(c: CanvasRenderingContext2D, item: Obstacle, target: boolean, device: Device, hints: boolean) {
  if (item.state === 'cleared' && !item.jumped) drawCheck(c, item.x);
  if (item.state !== 'live') return;
  const x = item.x;
  const y = GROUND - 54;
  if (!target) {
    // Waiting prompts stay quiet, so only one button ever asks for attention.
    badgePath(c, item.control, x, y, 9);
    c.fillStyle = '#14101F';
    c.fill();
    c.lineWidth = 0.8;
    c.strokeStyle = '#6A6288';
    c.stroke();
    drawGlyph(c, item.control, x, y, 5.6, device, '#B8B2CC');
    return;
  }
  const radius = 15;
  // A dark halo lifts the badge off whatever is behind it, then white gives it the most contrast on screen.
  badgePath(c, item.control, x, y, radius + 4);
  c.fillStyle = 'rgba(8, 5, 16, 0.72)';
  c.fill();
  badgePath(c, item.control, x, y, radius);
  c.fillStyle = '#FFFFFF';
  c.fill();
  c.lineWidth = 2.4;
  c.strokeStyle = '#FFC857';
  c.stroke();
  drawGlyph(c, item.control, x, y, radius * 0.66, device, item.control.ink);
  c.fillStyle = '#FFFFFF';
  c.beginPath();
  c.moveTo(x - 5, y + radius + 1);
  c.lineTo(x + 5, y + radius + 1);
  c.lineTo(x, y + radius + 8);
  c.closePath();
  c.fill();
  if (hints) {
    c.font = `700 9px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.strokeStyle = '#14101F';
    c.strokeText(item.control.name, x, y - radius - 6);
    c.fillStyle = '#FFFFFF';
    c.fillText(item.control.name, x, y - radius - 6);
  }
}

function drawPadMap(c: CanvasRenderingContext2D, device: Device, target: Control | undefined, visible: Set<string>) {
  const cx = STAGE_W / 2;
  const top = GROUND + 7;
  c.fillStyle = 'rgba(12, 9, 24, 0.9)';
  c.beginPath();
  c.roundRect(cx - 52, top - 3, 104, 42, 8);
  c.fill();
  const lit = (control: Control | undefined) => {
    if (!control) return '#2C2839';
    if (target?.id === control.id) return control.color;
    return visible.has(control.id) ? '#4A4366' : '#2C2839';
  };
  const byPad = new Map(device.tiers.flat().map((control) => [control.pad, control]));
  // Shoulders along the top
  ([[4, -40], [6, -26], [7, 14], [5, 28]] as const).forEach(([pad, dx]) => {
    const control = byPad.get(pad);
    rect(c, cx + dx, top, 12, 6, lit(control));
    c.font = `600 3.8px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = target?.id === control?.id ? '#14101F' : '#A9A3C4';
    c.fillText(control?.label ?? '', cx + dx + 6, top + 3.3);
  });
  // D-pad
  const dx = cx - 30;
  const dy = top + 20;
  ([[12, 0, -7], [13, 0, 7], [14, -7, 0], [15, 7, 0]] as const).forEach(([pad, x, y]) => {
    rect(c, dx + x - 3, dy + y - 3, 6, 6, lit(byPad.get(pad)));
  });
  // Face buttons
  const fx = cx + 30;
  ([[3, 0, -8], [0, 0, 8], [2, -8, 0], [1, 8, 0]] as const).forEach(([pad, x, y]) => {
    c.fillStyle = lit(byPad.get(pad));
    c.beginPath();
    c.arc(fx + x, dy + y, 4, 0, Math.PI * 2);
    c.fill();
  });
}

function drawKeyMap(c: CanvasRenderingContext2D, device: Device, target: Control | undefined, visible: Set<string>) {
  const unit = 11;
  const originX = STAGE_W / 2 - 4.25 * unit;
  const originY = GROUND + 15;
  c.fillStyle = 'rgba(12, 9, 24, 0.9)';
  c.beginPath();
  c.roundRect(originX - 5, GROUND + 4, 8.5 * unit + 10, 42, 8);
  c.fill();
  for (const control of device.tiers.flat()) {
    const [column, row, width = 1] = control.at ?? [0, 0, 1];
    const x = originX + column * unit;
    const y = originY + row * 7.4;
    const on = target?.id === control.id;
    rect(c, x, y, width * unit - 1.5, 6.4, on ? control.color : visible.has(control.id) ? '#4A4366' : '#2C2839');
    c.font = `600 4.6px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = on ? '#14101F' : '#A9A3C4';
    c.fillText(control.label, x + (width * unit - 1.5) / 2, y + 3.4);
  }
}

export interface DrawOptions {
  device: Device;
  hints: boolean;
  world: World;
  layers: HTMLImageElement[];
  best: number;
  delta: number;
}

export function drawRun(c: CanvasRenderingContext2D, run: RunState, fx: Fx, options: DrawOptions) {
  const { device, hints, world, layers, best, delta } = options;
  stepParticles(fx, delta);
  c.save();
  if (fx.shake > 0) c.translate(Math.round(Math.sin(fx.shake * 70) * 3), 0);
  drawWorld(c, world, run.distance);
  for (const item of run.obstacles) drawObstacle(c, world, item);

  const stumbling = run.time < run.stumbleUntil;
  const stepRate = 10;
  const frame = run.status === 'countdown' ? 4 : WALK[Math.floor(run.distance / stepRate) % WALK.length];
  const hopping = hopProgress(run) < 1;
  // A rounded arc, so her feet clear the corners of an obstacle.
  const hop = hopping ? Math.sin(hopProgress(run) * Math.PI) ** 0.7 * 38 : 0;
  const blink = stumbling && run.status !== 'over' && Math.floor(run.time * 14) % 2 === 0;
  const crashed = run.status === 'over' && run.obstacles.some((item) => item.state === 'crashed');
  const shadow = hopping ? 12 : 20;
  rect(c, PLAYER_X - shadow / 2, GROUND, shadow, 2, 'rgba(10, 7, 20, 0.6)');
  if (!blink) {
    c.imageSmoothingEnabled = false;
    const width = SPRITE_W * SPRITE_SCALE;
    const height = SPRITE_H * SPRITE_SCALE;
    c.save();
    // The art faces left, and she runs toward the obstacles on the right.
    c.translate(PLAYER_X + width / 2, 0);
    c.scale(-1, 1);
    if (crashed) {
      // She tips back from whatever she ran into.
      c.translate(width / 2, GROUND);
      c.rotate(1.2);
      c.translate(-width / 2, -GROUND + 4);
    }
    for (const layer of layers) {
      const pose = hopping ? 1 : frame;
      c.drawImage(layer, pose * SPRITE_W, 0, SPRITE_W, SPRITE_H, 0, Math.round(GROUND - height - hop), width, height);
    }
    c.restore();
  }

  for (const item of fx.particles) {
    c.globalAlpha = Math.min(1, item.life * 3);
    rect(c, item.x, item.y, 2, 2, item.color);
  }
  c.globalAlpha = 1;
  drawPetals(c, run);
  c.restore();

  const target = currentTarget(run);
  for (const item of [...run.obstacles].reverse()) drawPrompt(c, item, item === target, device, hints);

  const outlined = (text: string, x: number, y: number, color: string) => {
    c.lineWidth = 3;
    c.lineJoin = 'round';
    c.strokeStyle = '#14101F';
    c.strokeText(text, x, y);
    c.fillStyle = color;
    c.fillText(text, x, y);
  };
  c.textBaseline = 'alphabetic';
  c.textAlign = 'right';
  c.font = `700 18px ${FONT}`;
  outlined(String(run.score), STAGE_W - 10, 23, '#F6F3FB');
  c.font = `600 8px ${FONT}`;
  if (best > 0 && run.score > best) outlined(t.newBest, STAGE_W - 10, 34, '#FFC857');
  else if (best > 0) outlined(t.inRunBest(best), STAGE_W - 10, 34, '#F6F3FB');
  if (run.streak >= 3) {
    c.textAlign = 'left';
    outlined(`${run.streak} in a row`, 10, 18, '#FFC857');
  }

  if (hints) {
    const visible = new Set(device.tiers.slice(0, run.tier + 1).flat().map((control) => control.id));
    if (device.usesPad) drawPadMap(c, device, target?.control, visible);
    else drawKeyMap(c, device, target?.control, visible);
  }

  if (fx.message && run.time < fx.message.until) {
    c.textAlign = 'center';
    c.font = `700 11px ${FONT}`;
    c.lineWidth = 3;
    c.strokeStyle = '#14101F';
    c.strokeText(fx.message.text, STAGE_W / 2, 44);
    c.fillStyle = fx.message.color;
    c.fillText(fx.message.text, STAGE_W / 2, 44);
  }

  const banner = (title: string, note?: string) => {
    rect(c, 0, 0, STAGE_W, STAGE_H, 'rgba(10, 7, 20, 0.62)');
    c.textAlign = 'center';
    c.fillStyle = '#F6F3FB';
    c.font = `700 28px ${FONT}`;
    c.fillText(title, STAGE_W / 2, 90);
    if (note) {
      c.font = `500 8px ${FONT}`;
      c.fillStyle = '#C9C3E8';
      c.fillText(note, STAGE_W / 2, 106);
    }
  };
  if (run.status === 'countdown') banner(String(Math.ceil(run.countdown)));
}
