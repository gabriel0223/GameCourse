import { useCallback, useEffect, useRef, useState } from 'react';
import { CodexLinks } from '../components/CodexLinks';
import { ControlsGuide } from '../components/ControlsGuide';
import { PauseMenu } from '../components/PauseMenu';
import { ScoreBoard } from '../components/FriendBits';
import { RunResults } from '../components/RunResults';
import { VolumeSlider } from '../components/VolumeSlider';
import { bestScore } from '../domain/practice';
import type { FinishedRun, RunReward } from '../domain/practice';
import { jetControls } from '../practice/controls';
import type { JetScheme } from '../practice/controls';
import { PAD_PAUSE } from '../practice/devices';
import { PadReader, usePadConfirm, usePadStatus } from '../practice/gamepad';
import { createJetAudio, loadVolume, saveVolume } from '../practice/jetAudio';
import { currentTarget, dot, fireMissile, length, newJetRun, normalize, rightWing, stepJetRun, sub, switchTarget, toggleJetPause } from '../practice/jetGame';
import type { Ending, JetRun } from '../practice/jetGame';
import { HUD_H, HUD_W, drawHud } from '../practice/jetHud';
import { MouseFlight, readPadFlight } from '../practice/jetInput';
import { createJetScene } from '../practice/jetScene';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.practice;
const game = t.games.jet;
const GAME_ID = 'jet';
type Scheme = JetScheme;
const SCHEMES: Scheme[] = ['playstation', 'xbox', 'mouse'];

// Remembered for the visit, so a new run keeps the same setup.
let lastScheme: Scheme = 'playstation';
let lastHints = true;
let lastInvert = false;

interface Setup {
  scheme: Scheme;
  hints: boolean;
  invert: boolean;
}

interface Finished {
  run: FinishedRun;
  ending: Ending | null;
}

function FlightStage({ setup, onFinish }: { setup: Setup; onFinish(result: Finished): void }) {
  const { profile } = useLibrary();
  const canvas = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLCanvasElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const [paused, setPaused] = useState(false);
  const pause = useRef<() => void>(() => undefined);
  const quit = useRef<() => void>(() => undefined);
  const [volume, setVolume] = useState(loadVolume);
  const applyVolume = useRef<(value: number) => void>(() => undefined);
  const startVolume = useRef(volume);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const bestAtStart = useRef(bestScore(profile.practice, GAME_ID));

  useEffect(() => {
    const element = canvas.current;
    const overlay = hud.current;
    const context = overlay?.getContext('2d');
    if (!element || !overlay || !context) return;
    overlay.width = HUD_W * 2;
    overlay.height = HUD_H * 2;
    context.scale(2, 2);

    const scene = createJetScene(element);
    const audio = createJetAudio(startVolume.current);
    applyVolume.current = audio.setVolume;
    const run: JetRun = newJetRun();
    const usesPad = setup.scheme !== 'mouse';
    const reader = new PadReader();
    const mouse = new MouseFlight();
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let finished = false;
    let endTimer = 0;

    const report = () => {
      if (finished) return;
      finished = true;
      if (document.pointerLockElement) document.exitPointerLock();
      finish.current({
        run: { game: GAME_ID, device: setup.scheme, score: run.score, bestStreak: 0, mistakes: 0 },
        ending: run.ending,
      });
    };
    const capture = () => {
      if (usesPad || document.pointerLockElement) return;
      // A browser may refuse, and mouse flight then follows the pointer over the game.
      Promise.resolve(element.requestPointerLock?.()).catch(() => undefined);
    };
    const flipPause = () => {
      toggleJetPause(run);
      setPaused(run.status === 'paused');
      audio.setPaused(run.status === 'paused');
      if (run.status === 'running') capture();
      else if (document.pointerLockElement) document.exitPointerLock();
    };
    pause.current = flipPause;
    quit.current = () => {
      run.status = 'over';
      report();
    };
    capture();

    const hintText = t.jet.hints[setup.scheme];
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += delta;
      const input = usesPad ? readPadFlight(setup.invert) : mouse.read(delta, setup.invert);
      if (usesPad) {
        for (const button of reader.presses()) {
          if (button === PAD_PAUSE) flipPause();
          if (button === 1) fireMissile(run);
          if (button === 3) switchTarget(run);
        }
      }
      stepJetRun(run, delta, input.steer);
      // Sound reads the game's events first, because drawing clears them.
      audio.update(run);
      scene.render(run, { lookX: input.lookX, lookY: input.lookY, delta, time: clock });
      drawHud(context, run, {
        project: scene.project,
        best: bestAtStart.current,
        hints: setup.hints ? hintText : null,
        stick: input.stick,
      });

      const target = currentTarget(run);
      if (status.current) {
        const toTarget = target ? normalize(sub(target.pos, run.jet.pos)) : null;
        // The same facts the HUD draws, for screen readers and automated play.
        status.current.dataset.state = run.status;
        status.current.dataset.altitude = String(Math.round(run.jet.pos.y));
        status.current.dataset.score = String(run.score);
        status.current.dataset.threats = String(run.missiles.filter((item) => item.enemy).length);
        status.current.dataset.upright = run.jet.up.y.toFixed(2);
        status.current.dataset.quality = String(scene.quality);
        status.current.dataset.sound = audio.state();
        if (toTarget) {
          status.current.dataset.turn = dot(toTarget, rightWing(run.jet)).toFixed(3);
          status.current.dataset.climb = dot(toTarget, run.jet.up).toFixed(3);
          status.current.dataset.ahead = dot(toTarget, run.jet.nose).toFixed(3);
          status.current.dataset.range = String(Math.round(length(sub(target!.pos, run.jet.pos))));
          status.current.dataset.lock = run.lock.toFixed(2);
          status.current.dataset.health = String(target!.health);
        }
      }
      if (run.status === 'over' && !endTimer) endTimer = window.setTimeout(report, 1200);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const keyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        // With the mouse captured, the browser handles Esc and the lock change pauses instead.
        if (!document.pointerLockElement) flipPause();
        return;
      }
      if (usesPad) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) event.preventDefault();
      if (event.code === 'Space' && !event.repeat) switchTarget(run);
      mouse.key(event.code, true);
    };
    const keyUp = (event: KeyboardEvent) => {
      if (!usesPad) mouse.key(event.code, false);
    };
    const mouseMove = (event: MouseEvent) => {
      if (!usesPad) mouse.move(event, document.pointerLockElement === element, element.getBoundingClientRect());
    };
    const mouseDown = (event: MouseEvent) => {
      if (usesPad || run.status !== 'running') return;
      if (!document.pointerLockElement && event.target !== element) return;
      if (!document.pointerLockElement) capture();
      if (event.button === 0) mouse.setGun(true);
      if (event.button === 2) fireMissile(run);
    };
    const mouseUp = (event: MouseEvent) => {
      if (event.button === 0) mouse.setGun(false);
    };
    const lockChange = () => {
      if (!document.pointerLockElement && run.status === 'running') {
        mouse.release();
        flipPause();
      }
    };
    const stop = () => {
      mouse.release();
      if (run.status === 'running') flipPause();
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    const noMenu = (event: Event) => event.preventDefault();
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mousedown', mouseDown);
    document.addEventListener('mouseup', mouseUp);
    document.addEventListener('pointerlockchange', lockChange);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', stop);
    window.addEventListener('gamepaddisconnected', stop);
    element.parentElement?.addEventListener('contextmenu', noMenu);
    return () => {
      // Leaving the page drops the run without giving a reward.
      finished = true;
      window.clearTimeout(endTimer);
      cancelAnimationFrame(frame);
      if (document.pointerLockElement) document.exitPointerLock();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mousedown', mouseDown);
      document.removeEventListener('mouseup', mouseUp);
      document.removeEventListener('pointerlockchange', lockChange);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', stop);
      window.removeEventListener('gamepaddisconnected', stop);
      scene.dispose();
      audio.dispose();
    };
  }, [setup]);

  return (
    <>
      <div className="runner-frame jet-frame">
        <canvas ref={canvas} className="jet-canvas" role="img" aria-label={t.jet.canvasLabel} />
        <canvas ref={hud} className="jet-hud" aria-hidden="true" />
        {paused && (
          <PauseMenu guide={jetControls(setup.scheme)} onResume={() => pause.current()} onQuit={() => quit.current()}>
            <VolumeSlider
              value={volume}
              onChange={(value) => {
                setVolume(value);
                saveVolume(value);
                applyVolume.current(value);
              }}
            />
          </PauseMenu>
        )}
      </div>
      <p ref={status} className="sr-only" role="status" data-testid="jet-status" />
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

function SetupPanel({ onStart }: { onStart(setup: Setup): void }) {
  const { profile } = useLibrary();
  const [scheme, setScheme] = useState(lastScheme);
  const [hints, setHints] = useState(lastHints);
  const [invert, setInvert] = useState(lastInvert);
  const [volume, setVolume] = useState(loadVolume);
  const pad = usePadStatus();
  const usesPad = scheme !== 'mouse';
  const ready = !usesPad || pad.connected;

  const start = useCallback(() => {
    lastScheme = scheme;
    lastHints = hints;
    lastInvert = invert;
    onStart({ scheme, hints, invert });
  }, [hints, invert, onStart, scheme]);
  usePadConfirm(usesPad && pad.connected, start);

  let status: string = t.jet.mouseNote;
  if (usesPad) {
    if (pad.blocked) status = t.padBlocked;
    else if (!pad.connected) status = t.pressButton;
    else if (!pad.standard) status = t.notStandard;
    else status = t.connected(pad.name);
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
          {SCHEMES.map((item) => (
            <button
              className="device-option"
              key={item}
              type="button"
              role="radio"
              aria-checked={item === scheme}
              onClick={() => setScheme(item)}
            >
              <strong>{t.jet.schemes[item].name}</strong>
              <span>{t.jet.schemes[item].summary}</span>
            </button>
          ))}
        </div>
        <p className="runner-status" role="status" data-ready={ready}>
          {status}
        </p>
        <label className="check-field">
          <input type="checkbox" checked={hints} onChange={(event) => setHints(event.target.checked)} />
          {t.jet.hintsOption}
        </label>
        <label className="check-field">
          <input type="checkbox" checked={invert} onChange={(event) => setInvert(event.target.checked)} />
          {t.jet.invertOption}
        </label>
        <VolumeSlider
          value={volume}
          onChange={(value) => {
            setVolume(value);
            saveVolume(value);
          }}
        />
        <button className="button button-primary runner-start" type="button" disabled={!ready} onClick={start}>
          {t.jet.start}
        </button>
      </section>
      <ControlsGuide guide={jetControls(scheme)} />
      <CodexLinks ids={['playing-sticks', 'playing-triggers']} />
    </div>
  );
}

type Phase =
  | { name: 'setup' }
  | { name: 'playing'; setup: Setup; key: number }
  | { name: 'results'; setup: Setup; key: number; finished: Finished; reward: RunReward };

export function JetView() {
  const { recordRun } = useLibrary();
  const [phase, setPhase] = useState<Phase>({ name: 'setup' });

  const start = useCallback((setup: Setup) => {
    setPhase((old) => ({ name: 'playing', setup, key: 'key' in old ? old.key + 1 : 1 }));
  }, []);
  const again = useCallback(() => {
    setPhase((old) => (old.name === 'results' ? { name: 'playing', setup: old.setup, key: old.key + 1 } : old));
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
      {phase.name === 'setup' && <SetupPanel onStart={start} />}
      {phase.name === 'playing' && (
        <FlightStage
          key={phase.key}
          setup={phase.setup}
          onFinish={(finished) => {
            const reward = recordRun(finished.run);
            setPhase({ name: 'results', setup: phase.setup, key: phase.key, finished, reward });
          }}
        />
      )}
      {phase.name === 'results' && (
        <RunResults
          game={GAME_ID}
          score={phase.finished.run.score}
          stats={[{ label: t.bestScore, value: phase.reward.best }]}
          reward={phase.reward}
          note={phase.finished.ending ? t.jet.endings[phase.finished.ending] : undefined}
          usesPad={phase.setup.scheme !== 'mouse'}
          onAgain={again}
          onChange={() => setPhase({ name: 'setup' })}
        />
      )}
    </main>
  );
}
