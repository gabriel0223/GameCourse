import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ControlGuide } from '../practice/controls';
import { strings } from '../strings';
import { ControlsGuide } from './ControlsGuide';

const t = strings.practice;

interface PauseMenuProps {
  guide: ControlGuide;
  onResume(): void;
  onQuit(): void;
  children?: ReactNode;
}

export function PauseMenu({ guide, onResume, onQuit, children }: PauseMenuProps) {
  const resume = useRef<HTMLButtonElement>(null);
  useEffect(() => resume.current?.focus(), []);
  return (
    <div className="pause-menu" role="dialog" aria-label={t.paused}>
      <header>
        <h2>{t.paused}</h2>
        <div>
          <button ref={resume} className="button button-primary" type="button" onClick={onResume}>
            {t.resume}
          </button>
          <button className="button button-quiet" type="button" onClick={onQuit}>
            {t.quit}
          </button>
        </div>
      </header>
      <ControlsGuide guide={guide} />
      {children}
      <p className="pause-hint">{t.resumeHint}</p>
    </div>
  );
}
