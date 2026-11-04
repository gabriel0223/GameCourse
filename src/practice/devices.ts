export type DeviceId = 'playstation' | 'xbox' | 'keyboard';

export type ControlKind = 'face' | 'dpad' | 'shoulder' | 'key';

export interface Control {
  id: string;
  label: string;
  name: string;
  kind: ControlKind;
  color: string;
  // A darker version for the bright badge on the active prompt.
  ink: string;
  // Button number in the standard gamepad layout.
  pad?: number;
  // Physical key, so it stays in the same place on any keyboard layout.
  code?: string;
  // Where it sits on the keyboard hint, in key widths.
  at?: [column: number, row: number, width?: number];
}

export interface Device {
  id: DeviceId;
  name: string;
  summary: string;
  usesPad: boolean;
  // Buttons join the run in groups, so each group is learned before the next arrives.
  tiers: Control[][];
}

const DPAD = '#D8D4E8';
const SHOULDER = '#C9A6FF';

const dpad = (prefix: string): Control[] => [
  { id: `${prefix}-up`, label: 'Up', name: 'D-pad up', kind: 'dpad', color: DPAD, ink: '#14101F', pad: 12 },
  { id: `${prefix}-down`, label: 'Down', name: 'D-pad down', kind: 'dpad', color: DPAD, ink: '#14101F', pad: 13 },
  { id: `${prefix}-left`, label: 'Left', name: 'D-pad left', kind: 'dpad', color: DPAD, ink: '#14101F', pad: 14 },
  { id: `${prefix}-right`, label: 'Right', name: 'D-pad right', kind: 'dpad', color: DPAD, ink: '#14101F', pad: 15 },
];

const key = (label: string, code: string, column: number, row: number, width = 1, name = `${label} key`): Control => ({
  id: `key-${code}`,
  label,
  name,
  kind: 'key',
  color: '#F6F3FB',
  ink: '#14101F',
  code,
  at: [column, row, width],
});

export const DEVICES: Device[] = [
  {
    id: 'playstation',
    name: 'PlayStation',
    summary: 'Cross, Circle, Square, and Triangle. The names on your DualSense.',
    usesPad: true,
    tiers: [
      [
        { id: 'cross', label: 'Cross', name: 'Cross', kind: 'face', color: '#7C9BFF', ink: '#2447C8', pad: 0 },
        { id: 'circle', label: 'Circle', name: 'Circle', kind: 'face', color: '#F0708A', ink: '#CC1F47', pad: 1 },
        { id: 'square', label: 'Square', name: 'Square', kind: 'face', color: '#E58CD6', ink: '#AE2593', pad: 2 },
        { id: 'triangle', label: 'Triangle', name: 'Triangle', kind: 'face', color: '#5FD0B6', ink: '#0B8166', pad: 3 },
      ],
      dpad('ps'),
      [
        { id: 'l1', label: 'L1', name: 'L1', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 4 },
        { id: 'r1', label: 'R1', name: 'R1', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 5 },
        { id: 'l2', label: 'L2', name: 'L2', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 6 },
        { id: 'r2', label: 'R2', name: 'R2', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 7 },
      ],
    ],
  },
  {
    id: 'xbox',
    name: 'Xbox',
    summary: 'A, B, X, and Y. Many PC games show these, even with a DualSense connected.',
    usesPad: true,
    tiers: [
      [
        { id: 'a', label: 'A', name: 'A', kind: 'face', color: '#7CCB5A', ink: '#247A16', pad: 0 },
        { id: 'b', label: 'B', name: 'B', kind: 'face', color: '#F0605A', ink: '#C81F1F', pad: 1 },
        { id: 'x', label: 'X', name: 'X', kind: 'face', color: '#4E9BF0', ink: '#155FC0', pad: 2 },
        { id: 'y', label: 'Y', name: 'Y', kind: 'face', color: '#FFC857', ink: '#946A00', pad: 3 },
      ],
      dpad('xbox'),
      [
        { id: 'lb', label: 'LB', name: 'LB', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 4 },
        { id: 'rb', label: 'RB', name: 'RB', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 5 },
        { id: 'lt', label: 'LT', name: 'LT', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 6 },
        { id: 'rt', label: 'RT', name: 'RT', kind: 'shoulder', color: SHOULDER, ink: '#14101F', pad: 7 },
      ],
    ],
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    summary: 'The keys most PC games use, starting with W, A, S, and D.',
    usesPad: false,
    tiers: [
      [key('W', 'KeyW', 2, 0), key('A', 'KeyA', 1.25, 1), key('S', 'KeyS', 2.25, 1), key('D', 'KeyD', 3.25, 1)],
      [key('Space', 'Space', 3, 3, 4, 'Space bar'), key('E', 'KeyE', 3, 0), key('Q', 'KeyQ', 1, 0), key('R', 'KeyR', 4, 0)],
      [key('Shift', 'ShiftLeft', 0, 2, 1.75, 'Left Shift'), key('F', 'KeyF', 4.25, 1), key('C', 'KeyC', 3.75, 2), key('1', 'Digit1', 0.5, -1)],
    ],
  },
];

export const findDevice = (id: DeviceId): Device => DEVICES.find((device) => device.id === id) ?? DEVICES[0];
export const allControls = (device: Device) => device.tiers.flat();
export const PAD_PAUSE = 9;
