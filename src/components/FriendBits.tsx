import { friendsWithGame, rivalry, scoreBoard } from '../domain/friends';
import type { Friend } from '../domain/friends';
import { wornPieces } from '../domain/wardrobe';
import { entryMinutes } from '../domain/xp';
import { formatDuration } from '../format';
import { useFriends } from '../state/FriendsContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { Sprite } from './Sprite';
import { Star } from './Star';

const t = strings.friends;

export const friendName = (friend: Friend) => friend.profile.characterName || t.unnamed;

export function FriendAvatar({ friend, scale, walking = false }: { friend: Friend; scale: number; walking?: boolean }) {
  return <Sprite profile={friend.profile} equipped={wornPieces(friend.profile)} scale={scale} walking={walking} />;
}

// A line under a game card for each friend who has the game.
export function FriendTags({ gameId }: { gameId: string }) {
  const { friends } = useFriends();
  const found = friendsWithGame(friends, gameId);
  if (!found.length) return null;
  return (
    <span className="game-card-friends">
      {found.map(({ friend, entry }) => {
        const name = friendName(friend);
        const rated = entry.status === 'finished' && entry.rating;
        return (
          <span key={friend.id} className="game-card-friend">
            <span className="game-card-friend-name">{name}</span>
            {rated ? (
              <span className="game-card-friend-rating" aria-label={t.rated(name, entry.rating!)}>
                <Star />
                {entry.rating}
              </span>
            ) : (
              <span>{strings.lists[entry.status]}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// On a game's page: what each friend thought of it.
export function GameFriends({ gameId }: { gameId: string }) {
  const { friends } = useFriends();
  const found = friendsWithGame(friends, gameId);
  if (!found.length) return null;
  return (
    <section className="friends-on-game">
      <h2>{t.onGame}</h2>
      <ul>
        {found.map(({ friend, entry }) => {
          const name = friendName(friend);
          const minutes = entryMinutes(entry);
          const rating = entry.status === 'finished' ? entry.rating : null;
          return (
            <li key={friend.id}>
              <a href={hrefs.friend(friend.id)}>
                <span className="friend-head">
                  <FriendAvatar friend={friend} scale={3} />
                </span>
                <span className="friend-on-game-copy">
                  <strong>{rating ? t.rated(name, rating) : name}</strong>
                  <span>
                    <span className={`status-badge status-${entry.status}`}>{strings.lists[entry.status]}</span>
                    {minutes > 0 ? t.played(formatDuration(minutes)) : t.notStarted}
                  </span>
                </span>
                {rating && (
                  <span className="friend-on-game-rating" aria-hidden="true">
                    <Star />
                    {rating}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Her best and her friends' bests for one minigame. Hidden until a friend has a score.
export function ScoreBoard({ game, ownBest }: { game: string; ownBest: number }) {
  const { friends } = useFriends();
  const rows = scoreBoard(ownBest, friends, game);
  if (rows.length < 2) return null;
  return (
    <section className="score-board">
      <h3>{t.scores}</h3>
      <ol>
        {rows.map((row, index) => (
          <li key={row.friend?.id ?? 'you'} data-you={!row.friend}>
            <span className="score-rank">{index + 1}</span>
            <span className="score-name">
              {row.friend ? <a href={hrefs.friend(row.friend.id)}>{friendName(row.friend)}</a> : t.you}
            </span>
            <b>{row.best || '–'}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Each friend's best, small, for the Practice cards.
export function FriendBests({ game }: { game: string }) {
  const { friends } = useFriends();
  const rows = scoreBoard(0, friends, game).filter((row) => row.friend);
  if (!rows.length) return null;
  return (
    <span className="practice-friend-bests">
      {rows.map((row) => (
        <span key={row.friend!.id}>
          {friendName(row.friend!)} <b>{row.best}</b>
        </span>
      ))}
    </span>
  );
}

// One line on the results screen about where she stands against her friends.
export function RivalNote({ game, score, previousBest }: { game: string; score: number; previousBest: number }) {
  const { friends } = useFriends();
  if (score < 1) return null;
  const { passed, next, leading } = rivalry(score, previousBest, friends, game);
  if (passed.length) return <p className="runner-rival runner-rival-win">{t.passed(passed.map(friendName))}</p>;
  if (next) return <p className="runner-rival">{t.chase(friendName(next.friend), next.best)}</p>;
  if (leading) return <p className="runner-rival">{t.leading}</p>;
  return null;
}
