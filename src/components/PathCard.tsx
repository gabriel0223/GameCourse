import { originalArt } from '../content/art';
import type { Path } from '../content/paths';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { PathMeter } from './PathMeter';

const t = strings.codex.paths;

function PassedBadge() {
  return (
    <span className="path-badge">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
      {t.passedBadge}
    </span>
  );
}

export function PathCard({ path }: { path: Path }) {
  const { profile } = useLibrary();
  return (
    <a className="genre-card" href={hrefs.path(path.id)}>
      <img className="codex-art codex-art-pixel" src={originalArt(path.art ?? '')} alt="" />
      {profile.quizzes[path.id]?.passed && <PassedBadge />}
      <span className="genre-card-body">
        <strong>{path.title}</strong>
        <span>{path.summary}</span>
        <PathMeter path={path} />
      </span>
    </a>
  );
}
