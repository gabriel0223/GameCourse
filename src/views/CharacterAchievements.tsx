import { useState } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { ACHIEVEMENT_XP, nextGoals } from '../domain/gamer';
import type { AchievementGroup } from '../domain/gamer';
import { usePlayer } from '../state/PlayerContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.character;
const GROUPS: Array<[AchievementGroup, IconName]> = [
  ['Library', 'library'],
  ['Finishing', 'flag'],
  ['Exploring', 'compass'],
  ['Character', 'character'],
  ['Codex', 'codex'],
  ['Quests', 'quest'],
  ['Practice', 'practice'],
];
type Filter = 'all' | 'earned' | 'locked';
const FILTERS: Filter[] = ['all', 'earned', 'locked'];

const GOAL_LINKS: Record<AchievementGroup, string> = {
  Library: '#/',
  Finishing: '#/',
  Exploring: '#/',
  Character: hrefs.characterTab('wardrobe'),
  Codex: hrefs.paths,
  Quests: hrefs.quests,
  Practice: hrefs.practice,
};

function NextUp() {
  const { gamer } = usePlayer();
  const goals = nextGoals(gamer);
  return (
    <section className="character-section achievement-next">
      <h2>{t.nextUp}</h2>
      {goals.length === 0 ? (
        <p className="empty-small">{t.allEarned}</p>
      ) : (
        <ul className="next-up">
          {goals.map((goal) => (
            <li key={goal.id}>
              <a href={GOAL_LINKS[goal.group]}>
                <span className="next-up-icon">
                  <Icon name="trophy" />
                </span>
                <span className="next-up-copy">
                  <strong>{goal.title}</strong>
                  <span>{goal.description}</span>
                  {goal.progress && (
                    <span className="goal-progress">
                      <span className="goal-bar">
                        <i style={{ width: `${Math.round((goal.progress.current / goal.progress.target) * 100)}%` }} />
                      </span>
                      <small>
                        {goal.progress.current} / {goal.progress.target}
                      </small>
                    </span>
                  )}
                </span>
                <GoldAmount amount={goal.gold} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AchievementsTab() {
  const { gamer, friend } = usePlayer();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = (unlocked: boolean) => filter === 'all' || unlocked === (filter === 'earned');
  const percent = Math.round((gamer.earnedCount / gamer.achievements.length) * 100);

  return (
    <>
      <div className="achievement-summary">
        <strong>{t.achievementsSummary(gamer.earnedCount, gamer.achievements.length)}</strong>
        <span className="goal-bar">
          <i style={{ width: `${percent}%` }} />
        </span>
      </div>
      {!friend && filter !== 'earned' && <NextUp />}
      <div className="chips">
        {FILTERS.map((item) => (
          <button key={item} type="button" aria-pressed={item === filter} onClick={() => setFilter(item)}>
            {t.achievementFilters[item]}
          </button>
        ))}
      </div>
      {GROUPS.map(([group, icon]) => {
        const all = gamer.achievements.filter((item) => item.group === group);
        const items = all.filter((item) => shown(item.unlocked));
        if (!items.length) return null;
        const earned = all.filter((item) => item.unlocked).length;
        return (
          <section className="achievement-group" key={group}>
            <header>
              <Icon name={icon} />
              <h2>{group}</h2>
              <span className="count">
                {earned} / {all.length}
              </span>
            </header>
            <ul className="achievement-list">
              {items.map((item) => (
                <li className="achievement" key={item.id} data-earned={item.unlocked}>
                  <span className="achievement-mark">
                    <Icon name="trophy" />
                  </span>
                  <span>
                    <span className="achievement-title">
                      {item.title}
                      {item.unlocked && <span className="sr-only"> ({t.earned})</span>}
                    </span>
                    <span className="achievement-description">{item.description}</span>
                    {!item.unlocked && item.progress && (
                      <span className="goal-progress">
                        <span className="goal-bar">
                          <i style={{ width: `${Math.round((item.progress.current / item.progress.target) * 100)}%` }} />
                        </span>
                        <small>
                          {item.progress.current} / {item.progress.target}
                        </small>
                      </span>
                    )}
                  </span>
                  <span className="achievement-xp">{t.achievementReward(ACHIEVEMENT_XP, item.gold)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
