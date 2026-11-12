import { entryQuestState } from '../domain/quests';
import { useQuests } from '../state/QuestsContext';
import { strings } from '../strings';
import { Icon } from './Icon';

// A hexagon badge on Codex entries that have quests: ! to do, an hourglass while
// waiting for notes, and a check once complete. It sits in a card's top-left corner,
// opposite the round read mark, or right after the title in list rows.
// The hexagon is drawn as SVG so its dark outline keeps it readable on any artwork.
export function QuestMark({ entryId, inline = false }: { entryId: string; inline?: boolean }) {
  const { forEntry, status } = useQuests();
  const state = entryQuestState(forEntry(entryId).map((quest) => status(quest.id)));
  if (!state) return null;
  const label = strings.quests.mark[state];
  return (
    <i className={`quest-mark quest-mark-${state}${inline ? ' quest-mark-inline' : ''}`} role="img" aria-label={label} title={label}>
      <svg className="quest-mark-shape" viewBox="0 0 28 30" aria-hidden="true">
        <polygon points="14,1.5 26.5,8.25 26.5,21.75 14,28.5 1.5,21.75 1.5,8.25" />
      </svg>
      {state === 'open' && <b aria-hidden="true">!</b>}
      {state === 'waiting' && <Icon name="hourglass" />}
      {state === 'replied' && <Icon name="check" />}
    </i>
  );
}
