import { useEffect, useState } from 'react';

export interface PadStatus {
  connected: boolean;
  name: string;
  standard: boolean;
  blocked: boolean;
}

function readPads(): { pads: Gamepad[]; blocked: boolean } {
  try {
    return { pads: Array.from(navigator.getGamepads?.() ?? []).filter((pad): pad is Gamepad => Boolean(pad)), blocked: false };
  } catch {
    // Some embedded previews don't allow controllers at all.
    return { pads: [], blocked: true };
  }
}

// Browsers report what's held down, so this turns that into single presses.
export class PadReader {
  private held = new Set<string>();
  private primed = false;

  presses(): number[] {
    const pressed: number[] = [];
    const now = new Set<string>();
    for (const pad of readPads().pads) {
      pad.buttons.forEach((button, index) => {
        if (!button.pressed && button.value < 0.5) return;
        const key = `${pad.index}:${index}`;
        now.add(key);
        if (!this.held.has(key) && this.primed) pressed.push(index);
      });
    }
    this.held = now;
    // Anything already held when reading starts doesn't count as a press.
    this.primed = true;
    return pressed;
  }
}

function currentStatus(): PadStatus {
  const { pads, blocked } = readPads();
  const pad = pads[0];
  return {
    connected: Boolean(pad),
    name: pad ? pad.id.replace(/\s*\(.*$/, '').trim() || 'Controller' : '',
    standard: pad?.mapping === 'standard',
    blocked,
  };
}

export function usePadStatus(): PadStatus {
  const [status, setStatus] = useState(currentStatus);
  useEffect(() => {
    const update = () =>
      setStatus((old) => {
        const next = currentStatus();
        return JSON.stringify(old) === JSON.stringify(next) ? old : next;
      });
    const timer = window.setInterval(update, 300);
    window.addEventListener('gamepadconnected', update);
    window.addEventListener('gamepaddisconnected', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('gamepadconnected', update);
      window.removeEventListener('gamepaddisconnected', update);
    };
  }, []);
  return status;
}

// Lets the main controller button start or repeat a run from a menu.
export function usePadConfirm(enabled: boolean, onConfirm: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const reader = new PadReader();
    let frame = 0;
    const started = performance.now();
    const loop = () => {
      const presses = reader.presses();
      if (performance.now() - started > 600 && presses.includes(0)) {
        onConfirm();
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [enabled, onConfirm]);
}

const DEAD_ZONE = 0.14;

// Ignores the small drift every stick has, then keeps the full range past it.
export function stickAxis(value: number | undefined) {
  const amount = value ?? 0;
  const size = Math.abs(amount);
  // Also catches an unreadable value, which would otherwise break the flight.
  if (!(size >= DEAD_ZONE)) return 0;
  return (Math.sign(amount) * (size - DEAD_ZONE)) / (1 - DEAD_ZONE);
}

export function firstPad(): Gamepad | null {
  return readPads().pads[0] ?? null;
}
