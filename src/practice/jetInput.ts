import { firstPad, stickAxis } from './gamepad';
import type { Steer } from './jetGame';

export interface FlightInput {
  steer: Steer;
  lookX: number;
  lookY: number;
  // Where the mouse is holding the virtual stick, from -1 to 1, for drawing on the HUD.
  stick: { x: number; y: number } | null;
}

const held = (pad: Gamepad | null, button: number) => Boolean(pad?.buttons[button]?.pressed);

export function readPadFlight(invert: boolean): FlightInput {
  const pad = firstPad();
  const climb = -stickAxis(pad?.axes[1]);
  return {
    steer: {
      pitch: invert ? -climb : climb,
      roll: stickAxis(pad?.axes[0]),
      yaw: (held(pad, 5) ? 1 : 0) - (held(pad, 4) ? 1 : 0),
      boost: pad?.buttons[7]?.value ?? 0,
      brake: pad?.buttons[6]?.value ?? 0,
      gun: held(pad, 0),
    },
    lookX: stickAxis(pad?.axes[2]),
    lookY: stickAxis(pad?.axes[3]),
    stick: null,
  };
}

const SENSITIVITY = 0.0042;
// The stick eases back to center, so a small mouse move makes a small correction.
const RECENTER = 1.9;
const POINTER_DEAD_ZONE = 0.06;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

// The mouse aims the nose up, down, left, and right, while A and D roll the jet.
export class MouseFlight {
  private stickX = 0;
  private stickY = 0;
  private lookX = 0;
  private lookY = 0;
  private boost = 0;
  private brake = 0;
  private rollLeft = 0;
  private rollRight = 0;
  private gun = false;
  private looking = false;
  private screen: { x: number; y: number } | null = null;

  move(event: MouseEvent, locked: boolean, area: DOMRect) {
    if (locked) {
      this.screen = null;
      if (this.looking) {
        this.lookX = clamp(this.lookX + event.movementX * 0.004, -1, 1);
        this.lookY = clamp(this.lookY + event.movementY * 0.004, -1, 1);
      } else {
        this.stickX = clamp(this.stickX + event.movementX * SENSITIVITY, -1, 1);
        this.stickY = clamp(this.stickY - event.movementY * SENSITIVITY, -1, 1);
      }
      return;
    }
    // Some embedded pages can't capture the mouse, so its position on the game is used instead.
    this.screen = {
      x: clamp(((event.clientX - area.left) / area.width) * 2 - 1, -1, 1),
      y: clamp(1 - ((event.clientY - area.top) / area.height) * 2, -1, 1),
    };
  }

  key(code: string, down: boolean) {
    const value = down ? 1 : 0;
    if (code === 'KeyW') this.boost = value;
    if (code === 'KeyS') this.brake = value;
    if (code === 'KeyA') this.rollLeft = value;
    if (code === 'KeyD') this.rollRight = value;
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      this.looking = down;
      if (!down) {
        this.lookX = 0;
        this.lookY = 0;
      }
    }
  }

  setGun(down: boolean) {
    this.gun = down;
  }

  release() {
    this.boost = 0;
    this.brake = 0;
    this.rollLeft = 0;
    this.rollRight = 0;
    this.gun = false;
    this.looking = false;
    this.lookX = 0;
    this.lookY = 0;
    this.stickX = 0;
    this.stickY = 0;
  }

  read(delta: number, invert: boolean): FlightInput {
    if (this.screen) {
      const dead = (value: number) => (Math.abs(value) < POINTER_DEAD_ZONE ? 0 : value);
      this.stickX = dead(this.screen.x);
      this.stickY = dead(this.screen.y);
    } else {
      const fade = Math.exp(-RECENTER * delta);
      this.stickX *= fade;
      this.stickY *= fade;
    }
    return {
      steer: {
        pitch: invert ? -this.stickY : this.stickY,
        roll: this.rollRight - this.rollLeft,
        yaw: this.stickX,
        boost: this.boost,
        brake: this.brake,
        gun: this.gun,
      },
      lookX: this.lookX,
      lookY: this.lookY,
      stick: { x: this.stickX, y: this.stickY },
    };
  }
}
