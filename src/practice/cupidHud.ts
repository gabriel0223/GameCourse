import { strings } from '../strings';
import { COMBO_STEP, DASH_RECHARGE, MAX_COMBO, MAX_HP, PLUSHIE_LIFE, PLUSHIE_POINTS, drawPower } from './cupidGame';
import type { CupidEvent, CupidRun, Flat } from './cupidGame';
import type { Projected } from './cupidScene';

export const HUD_W = 640;
export const HUD_H = 360;
const FONT = '"Sora Variable", "Figtree Variable", sans-serif';
const PINK = '#FF5F94';
const GOLD = '#FFD45E';
const WHITE = '#FFFFFF';
const INK = 'rgba(43, 20, 56, 0.9)';
const t = strings.practice.cupid;

interface FloatText {
  text: string;
  at: Flat;
  born: number;
  color: string;
}

export interface HudState {
  texts: FloatText[];
  banner: { text: string; detail: string; born: number; until: number } | null;
  hurt: number;
  comboBump: number;
}

export const newHud = (): HudState => ({ texts: [], banner: null, hurt: 0, comboBump: 0 });

export interface HudOptions {
  project(at: Flat, height?: number): Projected;
  best: number;
  hints: string | null;
  // Where the mouse points, from 0 to 1, when playing with a mouse.
  cursor: { x: number; y: number } | null;
  time: number;
}

function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 12, align: CanvasTextAlign = 'left') {
  c.font = `800 ${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.lineWidth = Math.max(3, size / 4);
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.strokeText(text, x, y);
  c.fillStyle = color;
  c.fillText(text, x, y);
}

function heartPath(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 2;
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 1.1, y - s * 0.95, x, y - s * 0.4);
  c.bezierCurveTo(x + s * 1.1, y - s * 0.95, x + s * 1.2, y + s * 0.1, x, y + s * 0.9);
  c.closePath();
}

function heart(c: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean) {
  heartPath(c, x, y, size);
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.stroke();
  c.fillStyle = filled ? PINK : 'rgba(255, 255, 255, 0.25)';
  c.fill();
  if (filled) {
    c.fillStyle = 'rgba(255, 255, 255, 0.7)';
    c.fillRect(x - size * 0.3, y - size * 0.22, size * 0.14, size * 0.14);
  }
}

// Turns the game's events into floating numbers, banners, and flashes.
export function readHudEvents(hud: HudState, events: CupidEvent[], time: number) {
  for (const event of events) {
    if (event.type === 'grab') hud.texts.push({ text: `+${event.points}`, at: event.at, born: time, color: GOLD });
    else if (event.type === 'hurt') hud.hurt = time;
    else if (event.type === 'combo') hud.comboBump = time;
    else if (event.type === 'wave') hud.banner = { text: t.wave(event.wave), detail: event.wave === 1 ? t.firstWave : '', born: time, until: time + 1.8 };
    else if (event.type === 'cleared') {
      hud.banner = { text: t.cleared, detail: event.healed ? t.healed : '', born: time, until: time + 2 };
    }
  }
  hud.texts = hud.texts.filter((item) => time - item.born < 0.9);
}

export function drawHud(c: CanvasRenderingContext2D, run: CupidRun, hud: HudState, options: HudOptions) {
  const { time } = options;
  c.clearRect(0, 0, HUD_W, HUD_H);
  const toScreen = (p: Projected) => ({ x: p.x * HUD_W, y: p.y * HUD_H });

  // A soft red edge for a moment after a hit.
  const sinceHurt = time - hud.hurt;
  if (sinceHurt < 0.45) {
    const strength = 1 - sinceHurt / 0.45;
    const edge = c.createRadialGradient(HUD_W / 2, HUD_H / 2, HUD_H * 0.35, HUD_W / 2, HUD_H / 2, HUD_W * 0.62);
    edge.addColorStop(0, 'rgba(120, 20, 60, 0)');
    edge.addColorStop(1, `rgba(150, 20, 70, ${0.55 * strength})`);
    c.fillStyle = edge;
    c.fillRect(0, 0, HUD_W, HUD_H);
  }

  // Health hearts, top left, only when there's more than one to lose.
  if (MAX_HP > 1) for (let i = 0; i < MAX_HP; i += 1) heart(c, 24 + i * 26, 24, 20, i < run.player.hp);
  label(c, t.grabbed(run.grabbed), 16, MAX_HP > 1 ? 52 : 28, '#FFE3EE', 12);

  // Wave, top center.
  if (run.wave > 0) label(c, t.wave(run.wave), HUD_W / 2, 26, WHITE, 13, 'center');

  // Score and combo, top right.
  label(c, String(run.score), HUD_W - 16, 32, WHITE, 24, 'right');
  label(c, t.best(Math.max(options.best, run.score)), HUD_W - 16, 48, '#F6D7E4', 10, 'right');
  const bump = Math.max(0, 1 - (time - hud.comboBump) / 0.35);
  const comboSize = 15 + bump * 8;
  const comboColor = run.combo >= MAX_COMBO ? GOLD : run.combo > 1 ? '#FFB3CC' : '#E9DDF2';
  label(c, `x${run.combo}`, HUD_W - 16, 72 + bump * 3, comboColor, comboSize, 'right');
  for (let i = 0; i < COMBO_STEP; i += 1) {
    const filled = run.combo >= MAX_COMBO || i < run.comboProgress;
    const x = HUD_W - 74 + i * 10;
    c.fillStyle = INK;
    c.fillRect(x - 1, 79, 8, 6);
    c.fillStyle = filled ? comboColor : 'rgba(255, 255, 255, 0.25)';
    c.fillRect(x, 80, 6, 4);
  }
  label(c, t.worth(PLUSHIE_POINTS * run.combo), HUD_W - 16, 100, '#FFE3EE', 10, 'right');

  // A shrinking ring over each plushie shows how long it will stay.
  for (const plushie of run.plushies) {
    if (run.status === 'over') break;
    const at = toScreen(options.project(plushie.pos, 2));
    const left = Math.max(0, plushie.life / PLUSHIE_LIFE);
    c.lineCap = 'round';
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(at.x, at.y, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
    c.stroke();
    c.lineWidth = 2;
    c.strokeStyle = left < 0.3 ? PINK : GOLD;
    c.beginPath();
    c.arc(at.x, at.y, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
    c.stroke();
  }

  // The draw meter wraps around her while she holds the bow.
  const player = run.player;
  const center = toScreen(options.project(player.pos, 0.9));
  const power = drawPower(player);
  if (player.drawing && run.status === 'running') {
    const full = power >= 1;
    const radius = 26;
    c.lineCap = 'round';
    c.lineWidth = 6;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(center.x, center.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power);
    c.stroke();
    c.lineWidth = 3.5;
    c.strokeStyle = full ? (Math.floor(time * 12) % 2 ? GOLD : WHITE) : PINK;
    c.beginPath();
    c.arc(center.x, center.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power);
    c.stroke();
    if (full) label(c, t.full, center.x, center.y - radius - 6, GOLD, 10, 'center');
  }
  // A small bar under her fills back up after a dash.
  const dashLeft = Math.max(0, player.dashReady - run.time);
  if (dashLeft > 0 && run.status === 'running') {
    const fill = 1 - dashLeft / DASH_RECHARGE;
    c.fillStyle = INK;
    c.fillRect(center.x - 13, center.y + 30, 26, 5);
    c.fillStyle = '#C9F2FF';
    c.fillRect(center.x - 12, center.y + 31, 24 * Math.max(0, fill), 3);
  }

  // Points float up from where they were earned.
  for (const item of hud.texts) {
    const age = time - item.born;
    const at = toScreen(options.project(item.at, 1.4));
    c.globalAlpha = Math.max(0, 1 - age / 0.9);
    label(c, item.text, at.x, at.y - age * 34, item.color, 12, 'center');
    c.globalAlpha = 1;
  }

  // Mouse reticle.
  if (options.cursor && run.status !== 'over') {
    const x = options.cursor.x * HUD_W;
    const y = options.cursor.y * HUD_H;
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 2;
    c.strokeStyle = power >= 1 ? GOLD : WHITE;
    c.beginPath();
    c.arc(x, y, 7, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = PINK;
    c.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  // Countdown, then wave banners.
  if (run.status === 'countdown') {
    const count = Math.ceil(run.countdown);
    label(c, count > 0 ? String(count) : t.go, HUD_W / 2, HUD_H / 2 - 20, WHITE, 44, 'center');
    label(c, t.getReady, HUD_W / 2, HUD_H / 2 + 6, '#FFE3EE', 13, 'center');
  } else if (hud.banner && time < hud.banner.until) {
    const age = time - hud.banner.born;
    const grow = Math.min(1, age / 0.18);
    c.globalAlpha = Math.min(1, (hud.banner.until - time) / 0.3);
    label(c, hud.banner.text, HUD_W / 2, HUD_H / 2 - 30, WHITE, 18 + grow * 14, 'center');
    if (hud.banner.detail) label(c, hud.banner.detail, HUD_W / 2, HUD_H / 2 - 6, GOLD, 13, 'center');
    c.globalAlpha = 1;
  }

  if (options.hints && run.status !== 'over') {
    c.fillStyle = 'rgba(43, 20, 56, 0.55)';
    c.fillRect(0, HUD_H - 22, HUD_W, 22);
    label(c, options.hints, HUD_W / 2, HUD_H - 7, WHITE, 10, 'center');
  }
}
