import { strings } from '../strings';
import type { Device } from './devices';
import { TIER_SCORES } from './runnerGame';

export interface ControlRow {
  action: string;
  inputs: string[];
}

export interface ControlGuide {
  rows: ControlRow[];
  tip?: string;
}

const t = strings.practice.controls;

export function runnerControls(device: Device): ControlGuide {
  const groups = device.tiers.map((tier) => tier.map((item) => (item.kind === 'dpad' ? item.name : item.label)));
  return {
    rows: [
      { action: t.runner.obstacle, inputs: groups[0] },
      { action: t.runner.fromScore(TIER_SCORES[1]), inputs: groups[1] },
      { action: t.runner.fromScore(TIER_SCORES[2]), inputs: groups[2] },
      { action: t.pause, inputs: [device.usesPad ? t.padPause[device.id === 'xbox' ? 'xbox' : 'playstation'] : t.keyPause] },
    ],
  };
}

export type JetScheme = 'playstation' | 'xbox' | 'mouse';

const row = (action: string, ...inputs: string[]): ControlRow => ({ action, inputs });

export function jetControls(scheme: JetScheme): ControlGuide {
  const a = t.jet;
  if (scheme === 'mouse') {
    return {
      rows: [
        row(a.aim, 'Mouse'),
        row(a.roll, 'A', 'D'),
        row(a.gun, 'Hold left mouse'),
        row(a.missile, 'Right mouse'),
        row(a.target, 'Space'),
        row(a.boost, 'W'),
        row(a.brake, 'S'),
        row(a.look, 'Hold Shift + mouse'),
        row(t.pause, t.keyPause),
      ],
      tip: a.mouseTip,
    };
  }
  const xbox = scheme === 'xbox';
  return {
    rows: [
      row(a.pitch, 'Left stick up and down'),
      row(a.roll, 'Left stick left and right'),
      row(a.rudder, xbox ? 'LB' : 'L1', xbox ? 'RB' : 'R1'),
      row(a.gun, `Hold ${xbox ? 'A' : 'Cross'}`),
      row(a.missile, xbox ? 'B' : 'Circle'),
      row(a.target, xbox ? 'Y' : 'Triangle'),
      row(a.boost, xbox ? 'RT' : 'R2'),
      row(a.brake, xbox ? 'LT' : 'L2'),
      row(a.look, 'Right stick'),
      row(t.pause, t.padPause[xbox ? 'xbox' : 'playstation']),
    ],
    tip: a.padTip,
  };
}

export function cupidControls(scheme: JetScheme): ControlGuide {
  const a = t.cupid;
  if (scheme === 'mouse') {
    return {
      rows: [
        row(a.move, 'W', 'A', 'S', 'D'),
        row(a.aim, 'Mouse'),
        row(a.draw, 'Hold left mouse'),
        row(a.dash, 'Space', 'Right mouse'),
        row(t.pause, t.keyPause),
      ],
      tip: a.mouseTip,
    };
  }
  const xbox = scheme === 'xbox';
  return {
    rows: [
      row(a.move, 'Left stick'),
      row(a.aim, 'Right stick'),
      row(a.draw, `Hold ${xbox ? 'RT' : 'R2'}`, xbox ? 'RB' : 'R1'),
      row(a.dash, xbox ? 'LB' : 'L1', xbox ? 'LT' : 'L2'),
      row(t.pause, t.padPause[xbox ? 'xbox' : 'playstation']),
    ],
    tip: a.padTip,
  };
}
