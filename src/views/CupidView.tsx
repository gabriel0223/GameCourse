import { useCallback, useEffect, useRef, useState } from 'react';
import { CodexLinks } from '../components/CodexLinks';
import { ControlsGuide } from '../components/ControlsGuide';
import { PauseMenu } from '../components/PauseMenu';
import { ScoreBoard } from '../components/FriendBits';
import { RunResults } from '../components/RunResults';
import { spriteUrl } from '../components/Sprite';
import { VolumeSlider } from '../components/VolumeSlider';
import { bestScore } from '../domain/practice';
import type { FinishedRun, RunReward } from '../domain/practice';
import { createCupidAudio } from '../practice/cupidAudio';
import { accuracy, newCupidRun, stepCupidRun, toggleCupidPause } from '../practice/cupidGame';
import type { CupidRun, Ending } from '../practice/cupidGame';
import { HUD_H, HUD_W, drawHud, newHud, readHudEvents } from '../practice/cupidHud';
import { MouseControls, PAD, readPadControls, rumble } from '../practice/cupidInput';
import type { CupidScheme } from '../practice/cupidInput';
import { createCupidScene } from '../practice/cupidScene';
import { cupidControls } from '../practice/controls';
import { PAD_PAUSE } from '../practice/devices';
import { PadReader, usePadConfirm, usePadStatus } from '../practice/gamepad';
import { loadVolume, saveVolume } from '../practice/jetAudio';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.practice;
const game = t.games.cupid;
const GAME_ID = 'cupid';
const SCHEMES: CupidScheme[] = ['playstation', 'xbox', 'mouse'];

type Hero = 'bear' | 'self';
const HEROES: Hero[] = ['bear', 'self'];

// Remembered for the visit, so a new run keeps the same setup.
let lastScheme: CupidScheme = 'playstation';
let lastHints = true;
let lastHero: Hero = 'bear';

interface Setup {
  scheme: CupidScheme;
  hints: boolean;
  hero: Hero;
}

interface Finished {
  run: FinishedRun;
  ending: Ending | null;
  grabbed: number;
  wave: number;
  bestCombo: number;
  accuracy: number;
}

function ArenaStage({ setup, onFinish }: { setup: Setup; onFinish(result: Finished): void }) {
  const { profile, gamer } = useLibrary();
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

  // Her outfit is read once, so a run keeps one look from start to finish.
  // The bear is a 3D model, so it needs no sprite layers.
  const layerUrls = useRef(
    setup.hero === 'bear'
      ? null
      : [
      `base-${profile.skin}`,
      gamer.equipped.bottom?.id,
      gamer.equipped.top?.id,
      `hair-${profile.hairStyle}-${profile.hairColor}`,
      gamer.equipped.accessory?.id,
        ]
          .filter((name): name is string => Boolean(name && spriteUrl(name)))
          .map(spriteUrl),
  );

  useEffect(() => {
    const element = canvas.current;
    const overlay = hud.current;
    const context = overlay?.getContext('2d');
    if (!element || !overlay || !context) return;
    overlay.width = HUD_W * 2;
    overlay.height = HUD_H * 2;
    context.scale(2, 2);

    const layers = layerUrls.current?.map((url) => {
      const image = new Image();
      image.src = url;
      return image;
    });
    const scene = createCupidScene(element, layers ?? null);
    const audio = createCupidAudio(startVolume.current);
    applyVolume.current = audio.setVolume;
    const run: CupidRun = newCupidRun();
    const hudState = newHud();
    const usesPad = setup.scheme !== 'mouse';
    const reader = new PadReader();
    const mouse = new MouseControls();
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let finished = false;
    let endTimer = 0;
    let lastCount = Math.ceil(run.countdown);

    const report = () => {
      if (finished) return;
      finished = true;
      finish.current({
        run: { game: GAME_ID, device: setup.scheme, score: run.score, bestStreak: 0, mistakes: run.shots - run.landed },
        ending: run.ending,
        grabbed: run.grabbed,
        wave: run.wave,
        bestCombo: run.bestCombo,
        accuracy: accuracy(run),
      });
    };
    const flipPause = () => {
      toggleCupidPause(run);
      setPaused(run.status === 'paused');
      audio.setPaused(run.status === 'paused');
      mouse.release();
    };
    pause.current = flipPause;
    quit.current = () => {
      run.status = 'over';
      report();
    };

    const hintText = t.cupid.hints[setup.scheme];
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += delta;
      let dash = false;
      if (usesPad) {
        for (const button of reader.presses()) {
          if (button === PAD_PAUSE) flipPause();
          if (PAD.dashButtons.includes(button)) dash = true;
        }
      } else {
        dash = mouse.takeDash();
      }
      const controls = usesPad ? readPadControls() : mouse.read(run.player.pos, scene.groundAt);
      if (run.status !== 'paused') {
        stepCupidRun(run, { ...controls, dash, assist: usesPad }, delta);
        if (run.status === 'countdown' || (run.status === 'running' && lastCount > 0)) {
          const count = Math.max(0, Math.ceil(run.countdown));
          if (count !== lastCount) audio.tick(count === 0);
          lastCount = count;
        }
      }

      const events = run.events;
      run.events = [];
      audio.play(events, run.combo);
      if (usesPad) {
        for (const event of events) {
          if (event.type === 'shot') rumble(event.full ? 0.5 : 0.1, event.full ? 0.6 : 0.3, event.full ? 120 : 60);
          if (event.type === 'drawFull') rumble(0, 0.35, 40);
          if (event.type === 'hurt') rumble(0.9, 0.5, 260);
          if (event.type === 'pop' && event.kind === 'storm') rumble(0.6, 0.3, 160);
          if (event.type === 'grab') rumble(0.2, 0.5, 120);
          if (event.type === 'plushieHit') rumble(0.9, 0.2, 300);
        }
      }
      readHudEvents(hudState, events, clock);
      scene.render(run, { time: clock, delta: run.status === 'paused' ? 0 : delta, events });
      drawHud(context, run, hudState, {
        project: scene.project,
        best: bestAtStart.current,
        hints: setup.hints ? hintText : null,
        cursor: usesPad ? null : mouse.cursor,
        time: clock,
      });

      if (status.current) {
        // The same facts the HUD draws, for screen readers and automated play.
        status.current.dataset.state = run.status;
        status.current.dataset.score = String(run.score);
        status.current.dataset.wave = String(run.wave);
        status.current.dataset.hp = String(run.player.hp);
        status.current.dataset.combo = String(run.combo);
        status.current.dataset.enemies = String(run.enemies.length);
        status.current.dataset.x = run.player.pos.x.toFixed(2);
        status.current.dataset.z = run.player.pos.z.toFixed(2);
        const landed = run.enemies.filter((enemy) => enemy.spawning <= 0);
        const nearest = landed.sort(
          (a, b) => Math.hypot(a.pos.x - run.player.pos.x, a.pos.z - run.player.pos.z) - Math.hypot(b.pos.x - run.player.pos.x, b.pos.z - run.player.pos.z),
        )[0];
        status.current.dataset.plushies = run.plushies.map((item) => `${item.pos.x.toFixed(2)},${item.pos.z.toFixed(2)}`).join(' ');
        status.current.dataset.kinds = run.enemies.map((enemy) => enemy.kind).join(' ');
        status.current.dataset.nearest = nearest ? `${nearest.pos.x.toFixed(2)},${nearest.pos.z.toFixed(2)}` : '';
      }
      if (run.status === 'over' && !endTimer) endTimer = window.setTimeout(report, 1400);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const keyDown = (event: KeyboardEvent) => {
      audio.wake();
      if (event.code === 'Escape') {
        flipPause();
        return;
      }
      if (usesPad || event.ctrlKey || event.metaKey || event.altKey) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      mouse.key(event.code, true);
    };
    const keyUp = (event: KeyboardEvent) => mouse.key(event.code, false);
    const area = element.parentElement ?? element;
    const mouseMove = (event: MouseEvent) => mouse.point(event, area.getBoundingClientRect());
    const mouseDown = (event: MouseEvent) => {
      audio.wake();
      if (usesPad || run.status === 'paused' || run.status === 'over') return;
      if (event.target !== area && !area.contains(event.target as Node)) return;
      event.preventDefault();
      mouse.point(event, area.getBoundingClientRect());
      mouse.button(event.button, true);
    };
    const mouseUp = (event: MouseEvent) => mouse.button(event.button, false);
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
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', stop);
    window.addEventListener('gamepaddisconnected', stop);
    area.addEventListener('contextmenu', noMenu);
    return () => {
      // Leaving the page drops the run without giving a reward.
      finished = true;
      window.clearTimeout(endTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mousedown', mouseDown);
      document.removeEventListener('mouseup', mouseUp);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', stop);
      window.removeEventListener('gamepaddisconnected', stop);
      area.removeEventListener('contextmenu', noMenu);
      scene.dispose();
      audio.dispose();
    };
  }, [setup]);

  return (
    <>
      <div className={`runner-frame jet-frame${setup.scheme === 'mouse' ? ' cupid-mouse' : ''}`}>
        <canvas ref={canvas} className="jet-canvas" role="img" aria-label={t.cupid.canvasLabel} />
        <canvas ref={hud} className="jet-hud" aria-hidden="true" />
        {paused && (
          <PauseMenu guide={cupidControls(setup.scheme)} onResume={() => pause.current()} onQuit={() => quit.current()}>
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
      <p ref={status} className="sr-only" role="status" data-testid="cupid-status" />
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
  const [hero, setHero] = useState(lastHero);
  const [volume, setVolume] = useState(loadVolume);
  const pad = usePadStatus();
  const usesPad = scheme !== 'mouse';
  const ready = !usesPad || pad.connected;

  const start = useCallback(() => {
    lastScheme = scheme;
    lastHints = hints;
    lastHero = hero;
    onStart({ scheme, hints, hero });
  }, [hero, hints, onStart, scheme]);
  usePadConfirm(usesPad && pad.connected, start);

  let note: string = t.cupid.mouseNote;
  if (usesPad) {
    if (pad.blocked) note = t.padBlocked;
    else if (!pad.connected) note = t.pressButton;
    else if (!pad.standard) note = t.notStandard;
    else note = t.connected(pad.name);
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
              <strong>{t.cupid.schemes[item].name}</strong>
              <span>{t.cupid.schemes[item].summary}</span>
            </button>
          ))}
        </div>
        <p className="runner-status" role="status" data-ready={ready}>
          {note}
        </p>
        <fieldset className="cupid-hero">
          <legend>{t.cupid.playAs}</legend>
          {HEROES.map((item) => (
            <label className="check-field" key={item}>
              <input type="radio" name="cupid-hero" checked={hero === item} onChange={() => setHero(item)} />
              {t.cupid.heroes[item]}
            </label>
          ))}
        </fieldset>
        <label className="check-field">
          <input type="checkbox" checked={hints} onChange={(event) => setHints(event.target.checked)} />
          {t.cupid.hintsOption}
        </label>
        <VolumeSlider
          value={volume}
          onChange={(value) => {
            setVolume(value);
            saveVolume(value);
          }}
        />
        <button className="button button-primary runner-start" type="button" disabled={!ready} onClick={start}>
          {t.cupid.start}
        </button>
      </section>
      <ControlsGuide guide={cupidControls(scheme)} />
      <CodexLinks ids={['playing-sticks', 'playing-triggers']} />
    </div>
  );
}

type Phase =
  | { name: 'setup' }
  | { name: 'playing'; setup: Setup; key: number }
  | { name: 'results'; setup: Setup; key: number; finished: Finished; reward: RunReward };

export function CupidView() {
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
        <ArenaStage
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
          note={phase.finished.ending ? t.cupid.endings[phase.finished.ending] : undefined}
          stats={[
            { label: t.cupid.plushiesGrabbed, value: phase.finished.grabbed },
            { label: t.cupid.wavesReached, value: phase.finished.wave },
            { label: t.cupid.bestCombo, value: phase.finished.bestCombo },
            { label: t.cupid.accuracy, value: phase.finished.accuracy },
            { label: t.bestScore, value: phase.reward.best },
          ]}
          reward={phase.reward}
          usesPad={phase.setup.scheme !== 'mouse'}
          onAgain={again}
          onChange={() => setPhase({ name: 'setup' })}
        />
      )}
    </main>
  );
}
