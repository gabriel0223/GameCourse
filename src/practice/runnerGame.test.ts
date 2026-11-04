import { describe, expect, it } from 'vitest';
import { DEVICES, allControls, findDevice } from './devices';
import { CONTACT_X, PLAYER_X, SPAWN_X, TIER_SCORES, WRONG_LOCK, currentTarget, hopProgress, newRun, pressControl, stepRun, togglePause } from './runnerGame';
import type { RunState } from './runnerGame';

const device = findDevice('playstation');
const STEP = 1 / 60;

function running(): RunState {
  const run = newRun();
  stepRun(run, 3.01, device);
  expect(run.status).toBe('running');
  return run;
}

function untilTarget(run: RunState) {
  for (let i = 0; i < 2000 && !currentTarget(run); i += 1) stepRun(run, STEP, device);
  const target = currentTarget(run);
  if (!target) throw new Error('no obstacle appeared');
  return target;
}

const wrongFor = (control: { id: string }) => allControls(device).find((item) => item.id !== control.id)!;

describe('controller layouts', () => {
  it('gives every device unique controls in three groups', () => {
    for (const item of DEVICES) {
      expect(item.tiers).toHaveLength(3);
      const ids = allControls(item).map((control) => control.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('maps pads by button position and keyboards by physical key', () => {
    const number = (id: 'playstation' | 'xbox', name: string) => allControls(findDevice(id)).find((c) => c.name === name)?.pad;
    expect(number('playstation', 'Cross')).toBe(number('xbox', 'A'));
    expect(number('playstation', 'Circle')).toBe(number('xbox', 'B'));
    expect(number('playstation', 'Square')).toBe(number('xbox', 'X'));
    expect(number('playstation', 'Triangle')).toBe(number('xbox', 'Y'));
    for (const control of allControls(findDevice('keyboard'))) expect(control.code).toBeTruthy();
  });
});

describe('endless runner', () => {
  it('counts down before moving', () => {
    const run = newRun();
    stepRun(run, 1, device);
    expect(run.status).toBe('countdown');
    expect(run.distance).toBe(0);
    stepRun(run, 2.1, device);
    expect(run.status).toBe('running');
  });
  it('clears an obstacle with the right button', () => {
    const run = running();
    const target = untilTarget(run);
    pressControl(run, target.control);
    expect(target.state).toBe('cleared');
    expect(run.score).toBe(1);
    expect(run.streak).toBe(1);
    expect(run.status).toBe('running');
  });
  it('jumps a cleared obstacle when she reaches it, not when the button is pressed', () => {
    const run = running();
    const target = untilTarget(run);
    pressControl(run, target.control);
    expect(run.hopStart).toBe(-1);
    while (!target.jumped) stepRun(run, STEP, device);
    expect(run.hopStart).toBeGreaterThan(0);
    expect(run.status).toBe('running');
  });
  it('is in the air while the obstacle passes under her, at any speed', () => {
    for (const score of [0, 20, 45]) {
      const run = running();
      run.score = score;
      run.tier = 0;
      const target = untilTarget(run);
      pressControl(run, target.control);
      let airborneOverHer = true;
      while (target.x > PLAYER_X - 18) {
        stepRun(run, STEP, device);
        if (Math.abs(target.x - PLAYER_X) < 18 && hopProgress(run) >= 1) airborneOverHer = false;
      }
      expect(airborneOverHer, `score ${score}`).toBe(true);
    }
  });
  it('makes a wrong button stumble without costing a heart', () => {
    const run = running();
    const target = untilTarget(run);
    pressControl(run, wrongFor(target.control));
    expect(target.state).toBe('live');
    expect(run.mistakes).toBe(1);
    expect(run.status).toBe('running');
    pressControl(run, target.control);
    expect(target.state).toBe('live');
    stepRun(run, WRONG_LOCK + 0.01, device);
    pressControl(run, target.control);
    expect(target.state).toBe('cleared');
  });
  it('ignores presses when nothing is coming', () => {
    const run = running();
    pressControl(run, allControls(device)[0]);
    expect(run.mistakes).toBe(0);
  });
  it('ends the run on the first crash', () => {
    const run = running();
    for (let i = 0; i < 2000 && run.status === 'running'; i += 1) stepRun(run, STEP, device);
    expect(run.status).toBe('over');
    expect(run.obstacles.filter((item) => item.state === 'crashed')).toHaveLength(1);
    expect(run.score).toBe(0);
  });
  it('keeps the score earned before the crash', () => {
    const run = running();
    for (let i = 0; i < 5; i += 1) pressControl(run, untilTarget(run).control);
    for (let i = 0; i < 2000 && run.status === 'running'; i += 1) stepRun(run, STEP, device);
    expect(run.status).toBe('over');
    expect(run.score).toBe(5);
    const distance = run.distance;
    stepRun(run, 1, device);
    expect(run.distance).toBe(distance);
  });
  it('crashes only when she reaches the obstacle', () => {
    const run = running();
    const target = untilTarget(run);
    expect(target.x).toBe(SPAWN_X);
    while (target.state === 'live') stepRun(run, STEP, device);
    expect(target.x).toBeLessThanOrEqual(CONTACT_X);
    expect(target.state).toBe('crashed');
  });
  it('adds button groups as the score grows, and speeds up', () => {
    const run = running();
    const seen = new Set<string>();
    const startGap = () => run.distance;
    const before = startGap();
    stepRun(run, 1, device);
    const slow = run.distance - before;
    while (run.score < TIER_SCORES[2] + 12) {
      const target = untilTarget(run);
      seen.add(target.control.id);
      pressControl(run, target.control);
    }
    expect(run.tier).toBe(2);
    expect(seen.has('l1') || seen.has('r1') || seen.has('l2') || seen.has('r2')).toBe(true);
    expect([...seen].some((id) => id.startsWith('ps-'))).toBe(true);
    const mark = run.distance;
    stepRun(run, 1, device);
    expect(run.distance - mark).toBeGreaterThan(slow);
  });
  it('stays at face buttons until the first score goal', () => {
    const run = running();
    const face = device.tiers[0].map((control) => control.id);
    for (let i = 0; i < TIER_SCORES[1]; i += 1) {
      const target = untilTarget(run);
      expect(face).toContain(target.control.id);
      pressControl(run, target.control);
    }
  });
  it('never asks for the same button twice in a row', () => {
    const run = running();
    let last = '';
    for (let i = 0; i < 80; i += 1) {
      const target = untilTarget(run);
      expect(target.control.id).not.toBe(last);
      last = target.control.id;
      pressControl(run, target.control);
    }
  });
  it('freezes while paused', () => {
    const run = running();
    togglePause(run);
    const { distance } = run;
    stepRun(run, 2, device);
    expect(run.distance).toBe(distance);
    togglePause(run);
    expect(run.status).toBe('running');
  });
});
