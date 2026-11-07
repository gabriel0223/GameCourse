import { useEffect, useRef } from 'react';
import type { RunReward } from '../domain/practice';
import { usePadConfirm } from '../practice/gamepad';
import { strings } from '../strings';
import { RivalNote } from './FriendBits';

const t = strings.practice;

interface RunResultsProps {
  game: string;
  score: number;
  stats: Array<{ label: string; value: number }>;
  reward: RunReward;
  note?: string;
  usesPad: boolean;
  onAgain(): void;
  onChange(): void;
}

export function RunResults({ game, score, stats, reward, note, usesPad, onAgain, onChange }: RunResultsProps) {
  usePadConfirm(usesPad, onAgain);
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => again.current?.focus(), []);
  return (
    <section className="runner-results">
      <p className="practice-eyebrow">{reward.newBest ? t.newBest : t.results}</p>
      <p className="runner-score">{score}</p>
      {note && <p className="shop-note">{note}</p>}
      <dl className="runner-stats">
        {stats.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <RivalNote game={game} score={score} previousBest={reward.previousBest} />
      {reward.xp > 0 && <p className="runner-xp">{t.xpEarned(reward.xp)}</p>}
      {score < 1 && <p className="shop-note">{t.noXp}</p>}
      {reward.limitReached && <p className="shop-note">{t.dailyLimit}</p>}
      <div className="runner-result-actions">
        <button ref={again} className="button button-primary" type="button" onClick={onAgain}>
          {t.runAgain}
        </button>
        <button className="button" type="button" onClick={onChange}>
          {t.changeController}
        </button>
      </div>
    </section>
  );
}
