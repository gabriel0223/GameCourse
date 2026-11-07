import jetPicture from '../assets/practice/jet.png';
import runnerPicture from '../assets/practice/runner.png';
import { FriendBests } from '../components/FriendBits';
import { bestScore } from '../domain/practice';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.practice;
const GAMES = [
  { id: 'runner', href: hrefs.runner, picture: runnerPicture, ...t.games.runner },
  { id: 'jet', href: hrefs.jet, picture: jetPicture, ...t.games.jet },
];

export function PracticeView() {
  const { profile } = useLibrary();
  return (
    <main className="page">
      <header className="page-header">
        <h1>{t.title}</h1>
      </header>
      <p className="timeline-intro">{t.intro}</p>
      <p className="practice-desktop-note">{t.desktopOnly}</p>
      <div className="practice-grid">
        {GAMES.map((game) => (
          <a className="practice-card" href={game.href} key={game.id}>
            <img className="practice-picture" src={game.picture} alt={t.pictureAlt(game.title)} />
            <span className="practice-card-body">
              <span className="practice-eyebrow">
                {t.trains}: {game.skill}
              </span>
              <strong>{game.title}</strong>
              <span>{game.summary}</span>
              <span className="practice-card-foot">
                <span className="practice-best">
                  <small>{t.bestLabel}</small>
                  <b>{bestScore(profile.practice, game.id) || t.noBest}</b>
                  <FriendBests game={game.id} />
                </span>
                <span className="button button-primary">{t.play}</span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
