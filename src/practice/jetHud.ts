import { strings } from '../strings';
import { BULLET_SPEED, DRONE_HEALTH, add, currentTarget, headingOf, isLocked, leadPoint, length, noseVector, sub } from './jetGame';
import type { JetRun, Vec } from './jetGame';
import type { Projected } from './jetScene';

export const HUD_W = 640;
export const HUD_H = 360;
const FONT = '"Sora Variable", "Figtree Variable", sans-serif';
// A bright phosphor green, like a military HUD. The dark outlines keep it readable on the gold sky.
const GREEN = '#6BFF8E';
const RED = '#E01F2D';
const GOLD = '#FFC857';
const WHITE = '#FFFFFF';
const INK = 'rgba(10, 7, 20, 0.85)';
const GUN_RANGE = BULLET_SPEED * 0.85;
const t = strings.practice.jet;

export interface HudOptions {
  project(at: Vec): Projected;
  best: number;
  hints: string | null;
  stick: { x: number; y: number } | null;
}

function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 10, align: CanvasTextAlign = 'left') {
  c.font = `700 ${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.lineWidth = 3;
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.strokeText(text, x, y);
  c.fillStyle = color;
  c.fillText(text, x, y);
}

const toScreen = (p: Projected) => ({ x: (p.x * 0.5 + 0.5) * HUD_W, y: (0.5 - p.y * 0.5) * HUD_H });

function outlined(c: CanvasRenderingContext2D, color: string, width: number, draw: () => void) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.lineWidth = width + 2;
  c.beginPath();
  draw();
  c.stroke();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  draw();
  c.stroke();
}

function brackets(c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, width: number) {
  const reach = size * 0.42;
  outlined(c, color, width, () => {
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.moveTo(x + sx * size, y + sy * (size - reach));
      c.lineTo(x + sx * size, y + sy * size);
      c.lineTo(x + sx * (size - reach), y + sy * size);
    }
  });
}

function edgeArrow(c: CanvasRenderingContext2D, angle: number, color: string, radius = 118) {
  const x = HUD_W / 2 + Math.cos(angle) * radius * 1.5;
  const y = HUD_H / 2 + Math.sin(angle) * radius;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(15, 0);
  c.lineTo(-9, -11);
  c.lineTo(-9, 11);
  c.closePath();
  c.fill();
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(12, 0);
  c.lineTo(-7, -8);
  c.lineTo(-7, 8);
  c.closePath();
  c.fill();
  c.restore();
}

const offScreen = (p: Projected) => !p.front || Math.abs(p.x) > 0.96 || Math.abs(p.y) > 0.94;
const arrowAngle = (p: Projected) => {
  const sign = p.front ? 1 : -1;
  return Math.atan2(-p.y * sign * (HUD_H / HUD_W), p.x * sign);
};

function radar(c: CanvasRenderingContext2D, run: JetRun) {
  const cx = 56;
  const cy = HUD_H - 56;
  const radius = 42;
  c.fillStyle = 'rgba(10, 7, 20, 0.6)';
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(107, 255, 142, 0.75)';
  c.lineWidth = 1;
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, radius / 2, 0, Math.PI * 2);
  c.stroke();
  const heading = headingOf(run.jet);
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  const blip = (at: Vec, color: string, size: number) => {
    const offset = sub(at, run.jet.pos);
    const right = offset.x * cos + offset.z * sin;
    const ahead = offset.x * sin - offset.z * cos;
    const scale = radius / 1500;
    const distance = Math.min(radius - 3, Math.hypot(right, ahead) * scale);
    const angle = Math.atan2(ahead, right);
    c.fillStyle = color;
    c.fillRect(cx + Math.cos(angle) * distance - size / 2, cy - Math.sin(angle) * distance - size / 2, size, size);
  };
  for (const drone of run.drones) blip(drone.pos, drone.id === run.targetId ? GOLD : RED, 4);
  for (const missile of run.missiles) if (missile.enemy) blip(missile.pos, WHITE, 3);
  c.fillStyle = GREEN;
  c.beginPath();
  c.moveTo(cx, cy - 5);
  c.lineTo(cx + 4, cy + 4);
  c.lineTo(cx - 4, cy + 4);
  c.closePath();
  c.fill();
}

export function drawHud(c: CanvasRenderingContext2D, run: JetRun, options: HudOptions) {
  const { project, best, hints, stick } = options;
  c.clearRect(0, 0, HUD_W, HUD_H);

  const target = currentTarget(run);
  const flying = run.status === 'running' || run.status === 'paused';
  if (flying) {
    for (const drone of run.drones) {
      const spot = project(drone.pos);
      const chosen = drone === target;
      if (offScreen(spot)) {
        if (chosen) edgeArrow(c, arrowAngle(spot), WHITE);
        continue;
      }
      const { x, y } = toScreen(spot);
      if (!chosen) {
        brackets(c, x, y, 8, GREEN, 1.4);
        continue;
      }
      const locked = isLocked(run);
      const size = locked ? 15 : 25 - run.lock * 10;
      // White reads against the whole sunset, and a solid tag makes a lock impossible to miss.
      brackets(c, x, y, size, locked ? RED : WHITE, locked ? 3 : 2.2);
      label(c, `${Math.round(length(sub(drone.pos, run.jet.pos)))}`, x, y + size + 12, WHITE, 9, 'center');
      if (drone.health < DRONE_HEALTH) {
        c.fillStyle = INK;
        c.fillRect(x - 15, y + size + 15, 30, 5);
        c.fillStyle = WHITE;
        c.fillRect(x - 14, y + size + 16, 28 * (drone.health / DRONE_HEALTH), 3);
      }
      const lead = project(leadPoint(run, drone));
      if (lead.front && length(sub(drone.pos, run.jet.pos)) < GUN_RANGE) {
        const mark = toScreen(lead);
        outlined(c, GOLD, 1.5, () => {
          c.moveTo(mark.x, mark.y - 5);
          c.lineTo(mark.x + 5, mark.y);
          c.lineTo(mark.x, mark.y + 5);
          c.lineTo(mark.x - 5, mark.y);
          c.closePath();
        });
      }
      if (locked) {
        c.fillStyle = RED;
        c.fillRect(x - 19, y - size - 17, 38, 13);
        c.font = `700 9.5px ${FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        c.fillStyle = WHITE;
        c.fillText(t.lock, x, y - size - 7);
      }
    }
    const nose = project(add(run.jet.pos, noseVector(run.jet), 700));
    if (nose.front) {
      const { x, y } = toScreen(nose);
      outlined(c, GREEN, 1.5, () => {
        c.arc(x, y, 7, 0, Math.PI * 2);
        c.moveTo(x - 14, y);
        c.lineTo(x - 9, y);
        c.moveTo(x + 9, y);
        c.lineTo(x + 14, y);
      });
      if (stick) {
        outlined(c, WHITE, 1.5, () => {
          c.arc(x + stick.x * 34, y - stick.y * 34, 2.5, 0, Math.PI * 2);
        });
      }
    }

    const threats = run.missiles.filter((item) => item.enemy);
    if (threats.length) {
      const blink = Math.floor(run.time * 6) % 2 === 0;
      if (blink) {
        c.fillStyle = RED;
        c.fillRect(HUD_W / 2 - 62, 36, 124, 28);
        c.font = `700 19px ${FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        c.fillStyle = WHITE;
        c.fillText(t.missileWarning, HUD_W / 2, 57);
      }
      for (const missile of threats) {
        const spot = project(missile.pos);
        if (offScreen(spot)) edgeArrow(c, arrowAngle(spot), RED, 96);
        else {
          const { x, y } = toScreen(spot);
          outlined(c, RED, 2, () => {
            c.moveTo(x, y - 8);
            c.lineTo(x + 8, y);
            c.lineTo(x, y + 8);
            c.lineTo(x - 8, y);
            c.closePath();
          });
        }
      }
    }
    if (run.jet.pos.y < 130 && run.jet.nose.y < 0.02) label(c, t.pullUp, HUD_W / 2, HUD_H - 62, WHITE, 16, 'center');
    if (target && hints && offScreen(project(target.pos))) label(c, t.findTarget, HUD_W / 2, HUD_H - 40, WHITE, 9, 'center');

    radar(c, run);
    label(c, `${t.speed} ${Math.round(run.jet.speed * 3.6)}`, HUD_W - 14, HUD_H - 30, GREEN, 10, 'right');
    label(c, `${t.altitude} ${Math.round(run.jet.pos.y)}`, HUD_W - 14, HUD_H - 16, GREEN, 10, 'right');
    if (hints && run.time < 14) label(c, hints, HUD_W / 2, HUD_H - 16, WHITE, 9, 'center');
  }

  label(c, String(run.score), HUD_W - 14, 34, WHITE, 28, 'right');
  if (best > 0 && run.score > best) label(c, strings.practice.newBest, HUD_W - 14, 49, GOLD, 11, 'right');
  else if (best > 0) label(c, strings.practice.inRunBest(best), HUD_W - 14, 49, WHITE, 11, 'right');

  const banner = (title: string, note?: string) => {
    c.fillStyle = 'rgba(10, 7, 20, 0.45)';
    c.fillRect(0, 0, HUD_W, HUD_H);
    label(c, title, HUD_W / 2, HUD_H / 2 + 12, WHITE, 42, 'center');
    if (note) label(c, note, HUD_W / 2, HUD_H / 2 + 34, WHITE, 12, 'center');
  };
  if (run.status === 'countdown') banner(String(Math.ceil(run.countdown)));
}
