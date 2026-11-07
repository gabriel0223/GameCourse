import type { Flat } from './cupidGame';
import { firstPad } from './gamepad';

export type CupidScheme = 'playstation' | 'xbox' | 'mouse';

export interface CupidControls {
  move: Flat;
  aim: Flat | null;
  drawing: boolean;
}

// Twin-stick games read each stick as a circle, so diagonals are as easy as straight lines.
function stick(x: number | undefined, y: number | undefined, dead: number): Flat {
  const vx = x ?? 0;
  const vz = y ?? 0;
  const size = Math.hypot(vx, vz);
  if (!(size > dead)) return { x: 0, z: 0 };
  const scaled = Math.min(1, (size - dead) / (1 - dead));
  return { x: (vx / size) * scaled, z: (vz / size) * scaled };
}

// Buttons in the standard layout.
export const PAD = { dashButtons: [4, 6], r1: 5, r2: 7 };

export function readPadControls(): CupidControls {
  const pad = firstPad();
  const move = stick(pad?.axes[0], pad?.axes[1], 0.16);
  // The aim stick needs a firmer push, so letting go doesn't flick the aim somewhere else.
  const aimStick = stick(pad?.axes[2], pad?.axes[3], 0.4);
  const aiming = Math.hypot(aimStick.x, aimStick.z) > 0;
  const trigger = pad?.buttons[PAD.r2]?.value ?? 0;
  return {
    move,
    aim: aiming ? aimStick : null,
    drawing: trigger > 0.3 || Boolean(pad?.buttons[PAD.r1]?.pressed),
  };
}

// The rumble motors in a controller, where the browser allows them.
export function rumble(strong: number, weak: number, ms: number) {
  const pad = firstPad() as (Gamepad & { vibrationActuator?: { playEffect?: (type: string, params: object) => Promise<unknown> } }) | null;
  try {
    pad?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak })?.catch?.(() => undefined);
  } catch {
    // Some browsers have no rumble at all, which is fine.
  }
}

// WASD moves, the mouse aims, holding the left button draws, and Space or Shift dashes.
export class MouseControls {
  private keys = new Set<string>();
  private held = false;
  private dashQueued = false;
  // Where the pointer sits over the game, from 0 to 1.
  cursor: { x: number; y: number } | null = null;

  key(code: string, down: boolean) {
    if (down) {
      if ((code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') && !this.keys.has(code)) this.dashQueued = true;
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  point(event: MouseEvent, area: DOMRect) {
    this.cursor = {
      x: Math.min(1, Math.max(0, (event.clientX - area.left) / area.width)),
      y: Math.min(1, Math.max(0, (event.clientY - area.top) / area.height)),
    };
  }

  button(which: number, down: boolean) {
    if (which === 0) this.held = down;
    if (which === 2 && down) this.dashQueued = true;
  }

  release() {
    this.keys.clear();
    this.held = false;
    this.dashQueued = false;
  }

  takeDash() {
    const queued = this.dashQueued;
    this.dashQueued = false;
    return queued;
  }

  read(aimFrom: Flat, groundAt: (x: number, y: number) => Flat | null): CupidControls {
    const on = (...codes: string[]) => (codes.some((code) => this.keys.has(code)) ? 1 : 0);
    const move = {
      x: on('KeyD', 'ArrowRight') - on('KeyA', 'ArrowLeft'),
      z: on('KeyS', 'ArrowDown') - on('KeyW', 'ArrowUp'),
    };
    let aim: Flat | null = null;
    const spot = this.cursor ? groundAt(this.cursor.x, this.cursor.y) : null;
    if (spot) aim = { x: spot.x - aimFrom.x, z: spot.z - aimFrom.z };
    return { move, aim, drawing: this.held };
  }
}
