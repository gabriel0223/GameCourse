import type { CSSProperties } from 'react';
import { FriendAvatar, friendName } from '../components/FriendBits';
import { GameCard } from '../components/GameCard';
import { Icon } from '../components/Icon';
import type { Friend } from '../domain/friends';
import { deriveGamer } from '../domain/gamer';
import { GENRE_COLORS } from '../domain/genres';
import type { GameStatus } from '../domain/types';
import { useFriends } from '../state/FriendsContext';
import { FriendPlayer, usePlayer } from '../state/PlayerContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import type { FriendTab } from '../useHashRoute';
import { AchievementsTab } from './CharacterAchievements';
import { OverviewTab } from './CharacterOverview';
import { CharacterStage } from './CharacterStage';

const t = strings.friends;
const LISTS: GameStatus[] = ['playing', 'backlog', 'finished', 'dropped'];

function LevelBar({ friend }: { friend: Friend }) {
  const { progress } = deriveGamer(friend.entries, friend.profile);
  return (
    <span className="friend-level">
      <strong>
        {strings.level} {progress.level}
      </strong>
      <span className="xp-bar">
        <span
          style={{
            width: `${Math.round((progress.intoLevel / progress.needed) * 100)}%`,
          }}
        />
      </span>
      <small>
        {progress.intoLevel} / {progress.needed} XP
      </small>
    </span>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const gamer = deriveGamer(friend.entries, friend.profile);
  const favorite = gamer.stats.favoriteGenre;
  // Entries arrive newest first, so this is the game touched most recently.
  const playing = friend.entries.find((entry) => entry.status === 'playing');
  return (
    <a
      className="friend-card"
      href={hrefs.friend(friend.id)}
      style={
        {
          '--glow': favorite ? GENRE_COLORS[favorite] : '#8b7cf6',
        } as CSSProperties
      }
    >
      <span className="friend-card-stage">
        <FriendAvatar friend={friend} scale={6} walking />
      </span>
      <span className="friend-card-body">
        <span className="friend-card-name">{friendName(friend)}</span>
        <LevelBar friend={friend} />
        <span className="friend-card-playing">
          {playing ? (
            <>
              <small>{t.playing}</small> {playing.game.name}
            </>
          ) : (
            t.nothingPlaying
          )}
        </span>
        <dl className="friend-card-stats">
          <div>
            <dt>{t.hours}</dt>
            <dd>{Math.floor(gamer.stats.minutesPlayed / 60)}</dd>
          </div>
          <div>
            <dt>{t.finished}</dt>
            <dd>{gamer.stats.gamesFinished}</dd>
          </div>
          <div>
            <dt>{t.achievements}</dt>
            <dd>
              {gamer.earnedCount} / {gamer.achievements.length}
            </dd>
          </div>
        </dl>
      </span>
    </a>
  );
}

export function FriendsView() {
  const { friends, loading } = useFriends();
  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
      </header>
      <p className="timeline-intro">{t.intro}</p>
      {friends.length > 0 ? (
        <div className="friend-grid">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      ) : (
        !loading && <p className="empty">{t.empty}</p>
      )}
    </main>
  );
}

function FriendHeader() {
  const { friend } = usePlayer();
  return (
    <header className="character-header">
      <div className="character-heading">
        <h1>{friendName(friend!)}</h1>
      </div>
      <div className="character-level">
        <LevelBar friend={friend!} />
      </div>
    </header>
  );
}

function FriendLibrary({ list }: { list: GameStatus }) {
  const { friend, entries } = usePlayer();
  const visible = entries.filter((entry) => entry.status === list);
  return (
    <>
      <nav className="tabs" aria-label={t.tabs.library}>
        {LISTS.map((item) => (
          <a key={item} href={hrefs.friendList(friend!.id, item)} aria-current={item === list ? 'page' : undefined}>
            {strings.lists[item]}
            <span className="tab-count">{entries.filter((entry) => entry.status === item).length}</span>
          </a>
        ))}
      </nav>
      {visible.length > 0 ? (
        <div className="game-grid">
          {visible.map((entry) => (
            <GameCard key={entry.game.id} game={entry.game} entry={entry} friends={false} />
          ))}
        </div>
      ) : (
        <p className="empty">{t.emptyList(friendName(friend!))}</p>
      )}
    </>
  );
}

export function FriendProfileView({ id, tab, list }: { id: string; tab: FriendTab; list: GameStatus }) {
  const { find, loading } = useFriends();
  const friend = find(id);
  if (!friend) {
    if (loading) return <main className="page" aria-busy="true" />;
    return (
      <main className="page">
        <p className="notice">{t.notFound}</p>
        <a className="button" href={hrefs.friends}>
          <Icon name="friends" />
          {t.title}
        </a>
      </main>
    );
  }
  return (
    <FriendPlayer friend={friend}>
      <main className="page">
        <FriendHeader />
        {tab === 'overview' && (
          <div className="character">
            <section className="character-side" aria-label={friendName(friend)}>
              <CharacterStage />
            </section>
            <section className="character-main" aria-label={t.tabs.overview}>
              <OverviewTab />
            </section>
          </div>
        )}
        {tab === 'library' && <FriendLibrary list={list} />}
        {tab === 'achievements' && <AchievementsTab />}
      </main>
    </FriendPlayer>
  );
}
