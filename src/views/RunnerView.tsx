import { useCallback, useEffect, useRef, useState } from 'react';
import { CodexLinks } from '../components/CodexLinks';
import { ControlsGuide } from '../components/ControlsGuide';
import { PauseMenu } from '../components/PauseMenu';
import { ScoreBoard } from '../components/FriendBits';
import { RunResults } from '../components/RunResults';
import { spriteUrl } from '../components/Sprite';
import { bestScore } from '../domain/practice';
import type { FinishedRun, RunReward } from '../domain/practice';
import { runnerControls } from '../practice/controls';
import { DEVICES, PAD_PAUSE, allControls, findDevice } from '../practice/devices';
import type { Device, DeviceId } from '../practice/devices';
import { PadReader, usePadConfirm, usePadStatus } from '../practice/gamepad';
import { STAGE_H, STAGE_W, applyEvents, drawRun, loadWorld, newFx } from '../practice/runnerArt';
import { currentTarget, newRun, pressControl, stepRun, togglePause } from '../practice/runnerGame';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.practice;
const game = t.games.runner;
const GAME_ID = 'runner';

// Remembered for the visit, so a new run keeps the same setup.
let lastDevice: DeviceId = 'playstation';
let lastHints = true;

function RunnerStage({ device, hints, onFinish }: { device: Device; hints: boolean; onFinish(run: FinishedRun): void }) {
  const { profile, gamer } = useLibrary();
  const canvas = useRef<HTMLCanvasElement>(null);
  const announcer = useRef<HTMLParagraphElement>(null);
  const [paused, setPaused] = useState(false);
  const pause = useRef<() => void>(() => undefined);
  const quit = useRef<() => void>(() => undefined);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const bestAtStart = useRef(bestScore(profile.practice, GAME_ID));

  // The outfit is read once, so a run keeps one look from start to finish.
  const layerNames = useRef(
    [
      `base-${profile.skin}`,
      gamer.equipped.bottom?.id,
      gamer.equipped.top?.id,
      `hair-${profile.hairStyle}-${profile.hairColor}`,
      gamer.equipped.accessory?.id,
    ].filter((name): name is string => Boolean(name)),
  );

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const scale = Math.max(3, Math.round(3 * (window.devicePixelRatio || 1)));
    element.width = STAGE_W * scale;
    element.height = STAGE_H * scale;
    context.scale(scale, scale);
    context.imageSmoothingEnabled = false;

    const layers = layerNames.current.map((name) => {
      const image = new Image();
      image.src = spriteUrl(name);
      return image;
    });
    const world = loadWorld();
    const best = bestAtStart.current;
    const run = newRun();
    const fx = newFx();
    const reader = new PadReader();
    const controls = allControls(device);
    let frame = 0;
    let last = performance.now();
    let finished = false;
    let endTimer = 0;

    const report = () => {
      if (finished) return;
      finished = true;
      finish.current({ game: GAME_ID, device: device.id, score: run.score, bestStreak: run.bestStreak, mistakes: run.mistakes });
    };
    const flipPause = () => {
      togglePause(run);
      setPaused(run.status === 'paused');
    };
    pause.current = flipPause;
    quit.current = () => {
      run.status = 'over';
      report();
    };

    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const button of device.usesPad ? reader.presses() : []) {
        if (button === PAD_PAUSE) flipPause();
        const control = controls.find((item) => item.pad === button);
        if (control) pressControl(run, control);
      }
      stepRun(run, delta, device);
      applyEvents(fx, run.events, run.time);
      const prompt = currentTarget(run);
      const announcement = prompt ? `${prompt.id}: ${prompt.control.name}` : '';
      if (announcer.current && announcer.current.textContent !== announcement) {
        announcer.current.textContent = announcement;
      }
      context.imageSmoothingEnabled = false;
      drawRun(context, run, fx, { device, hints, world, layers, best, delta });
      // Leaves a moment to see the crash before the results.
      if (run.status === 'over' && !endTimer) endTimer = window.setTimeout(report, 800);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const keyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        flipPause();
        return;
      }
      if (device.usesPad || event.ctrlKey || event.metaKey || event.altKey) return;
      const control = controls.find((item) => item.code === event.code);
      if (!control) return;
      event.preventDefault();
      if (!event.repeat) pressControl(run, control);
    };
    const stop = () => {
      if (run.status === 'running') flipPause();
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('blur', stop);
    window.addEventListener('gamepaddisconnected', stop);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      // Leaving the page drops the run without giving a reward.
      finished = true;
      window.clearTimeout(endTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('blur', stop);
      window.removeEventListener('gamepaddisconnected', stop);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [device, hints]);

  return (
    <>
      <div className="runner-frame">
        <canvas ref={canvas} className="runner-canvas" role="img" aria-label={t.canvasLabel} />
        {paused && <PauseMenu guide={runnerControls(device)} onResume={() => pause.current()} onQuit={() => quit.current()} />}
      </div>
      <p ref={announcer} className="sr-only" role="status" data-testid="runner-prompt" />
      {!paused && (
        <div className="runner-controls">
          <button className="button" type="button" onClick={() => pause.current()}>
            {t.pause}
          </button>
          <button className="button button-quiet" type="button" onClick={() => quit.current()}>
            {t.quit}
          </button>
        </div>
      )}
    </>
  );
}

function Setup({ onStart }: { onStart(device: Device, hints: boolean): void }) {
  const { profile } = useLibrary();
  const [deviceId, setDeviceId] = useState(lastDevice);
  const [hints, setHints] = useState(lastHints);
  const pad = usePadStatus();
  const device = findDevice(deviceId);
  const ready = !device.usesPad || pad.connected;

  const start = useCallback(() => {
    lastDevice = deviceId;
    lastHints = hints;
    onStart(findDevice(deviceId), hints);
  }, [deviceId, hints, onStart]);
  usePadConfirm(device.usesPad && pad.connected, start);

  let status: string = t.keysNote;
  if (device.usesPad) {
    if (pad.blocked) status = t.padBlocked;
    else if (!pad.connected) status = t.pressButton;
    else if (!pad.standard) status = t.notStandard;
    else status = `${t.connected(pad.name)}. ${device.id === 'xbox' ? t.positionNote : ''}`.trim();
  }

  return (
    <div className="runner-setup">
      <section className="runner-about">
        <p className="practice-eyebrow">
          {t.trains}: {game.skill}
        </p>
        {game.about.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p className="practice-best">
          <small>{t.bestLabel}</small>
          <b>{bestScore(profile.practice, GAME_ID) || t.noBest}</b>
        </p>
        <ScoreBoard game={GAME_ID} ownBest={bestScore(profile.practice, GAME_ID)} />
      </section>
      <section className="runner-choice">
        <h2>{t.chooseController}</h2>
        <div className="device-options" role="radiogroup" aria-label={t.chooseController}>
          {DEVICES.map((item) => (
            <button
              className="device-option"
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === deviceId}
              onClick={() => setDeviceId(item.id)}
            >
              <strong>{item.name}</strong>
              <span>{item.summary}</span>
            </button>
          ))}
        </div>
        <p className="runner-status" role="status" data-ready={ready}>
          {status}
        </p>
        <label className="check-field">
          <input type="checkbox" checked={hints} onChange={(event) => setHints(event.target.checked)} />
          {t.hints}
        </label>
        <button className="button button-primary runner-start" type="button" disabled={!ready} onClick={start}>
          {t.start}
        </button>
      </section>
      <ControlsGuide guide={runnerControls(device)} />
      <CodexLinks ids={['playing-buttons', 'playing-dualsense']} />
    </div>
  );
}

type Phase =
  | { name: 'setup' }
  | { name: 'playing'; device: Device; hints: boolean; key: number }
  | { name: 'results'; device: Device; hints: boolean; run: FinishedRun; reward: RunReward; key: number };

export function RunnerView() {
  const { recordRun } = useLibrary();
  const [phase, setPhase] = useState<Phase>({ name: 'setup' });

  const start = useCallback((device: Device, hints: boolean) => {
    setPhase((old) => ({ name: 'playing', device, hints, key: 'key' in old ? old.key + 1 : 1 }));
  }, []);
  const again = useCallback(() => {
    setPhase((old) => (old.name === 'results' ? { ...old, name: 'playing', key: old.key + 1 } : old));
  }, []);

  return (
    <main className="page runner-page">
      <p className="practice-desktop-note">{t.desktopOnly}</p>
      {phase.name === 'setup' && (
        <a className="back" href={hrefs.practice}>
          {t.back}
        </a>
      )}
      <header className={phase.name === 'playing' ? 'sr-only' : 'page-header'}>
        <h1>{game.title}</h1>
      </header>
      {phase.name === 'setup' && <Setup onStart={start} />}
      {phase.name === 'playing' && (
        <RunnerStage
          key={phase.key}
          device={phase.device}
          hints={phase.hints}
          onFinish={(run) => {
            const reward = recordRun(run);
            setPhase({ ...phase, name: 'results', run, reward });
          }}
        />
      )}
      {phase.name === 'results' && (
        <RunResults
          game={GAME_ID}
          score={phase.run.score}
          stats={[
            { label: t.bestStreak, value: phase.run.bestStreak },
            { label: t.wrongPresses, value: phase.run.mistakes },
            { label: t.bestScore, value: phase.reward.best },
          ]}
          reward={phase.reward}
          usesPad={phase.device.usesPad}
          onAgain={again}
          onChange={() => setPhase({ name: 'setup' })}
        />
      )}
    </main>
  );
}
