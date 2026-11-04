import { pathRead } from '../content/paths';
import type { Path } from '../content/paths';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { GoldAmount } from './GoldAmount';

const t = strings.codex;

export function PathMeter({ path }: { path: Path }) {
  const { gamer, profile } = useLibrary();
  const read = pathRead(path, profile.readEntries);
  const total = path.entryIds.length;
  const done = Boolean(gamer.paths.find((item) => item.id === path.id)?.done);
  const allRead = read === total;
  return (
    <span className="path-meter" data-done={done}>
      <span className="path-meter-row">
        <span>{done ? t.pathDone : allRead ? t.paths.quizReady : t.pathProgress(read, total)}</span>
        <GoldAmount amount={path.gold} />
      </span>
      <span className="path-bar" aria-hidden="true">
        <i style={{ width: `${Math.round((read / total) * 100)}%` }} />
      </span>
    </span>
  );
}
