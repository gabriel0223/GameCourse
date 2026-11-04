import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { Icon } from '../components/Icon';
import { NAME_LIMIT } from '../domain/wardrobe';
import type { Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import type { CharacterTab } from '../useHashRoute';
import { AchievementsTab } from './CharacterAchievements';
import { OverviewTab } from './CharacterOverview';
import { CharacterStage } from './CharacterStage';
import { WardrobeTab } from './CharacterWardrobe';

const t = strings.character;

function CharacterName() {
  const { profile, setCharacterName } = useLibrary();
  const [draft, setDraft] = useState<string | null>(null);

  function finish() {
    if (draft !== null) setCharacterName(draft);
    setDraft(null);
  }

  function keys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') setDraft(null);
  }

  return (
    <div className="character-heading">
      {draft === null ? (
        <>
          <h1>{profile.characterName || t.title}</h1>
          <button
            className="character-rename"
            type="button"
            aria-label={profile.characterName ? t.rename : t.namePlaceholder}
            title={profile.characterName ? t.rename : t.namePlaceholder}
            onClick={() => setDraft(profile.characterName)}
          >
            <Icon name="pencil" />
          </button>
        </>
      ) : (
        <input
          id="character-name"
          className="character-name-input"
          type="text"
          autoComplete="off"
          autoFocus
          aria-label={t.name}
          maxLength={NAME_LIMIT}
          placeholder={t.namePlaceholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finish}
          onKeyDown={keys}
        />
      )}
    </div>
  );
}

function CharacterHeader() {
  const { gamer } = useLibrary();
  const { progress } = gamer;
  return (
    <header className="character-header">
      <CharacterName />
      <div className="character-level">
        <span className="character-level-top">
          <strong>
            {strings.level} {progress.level}
          </strong>
          <GoldAmount amount={gamer.gold.balance} />
        </span>
        <span className="xp-bar">
          <span style={{ width: `${Math.round((progress.intoLevel / progress.needed) * 100)}%` }} />
        </span>
        <span className="character-xp">
          {progress.intoLevel} / {progress.needed} XP
        </span>
      </div>
    </header>
  );
}

export function CharacterView({ tab, slot }: { tab: CharacterTab; slot: Slot | null }) {
  return (
    <main className="page">
      <CharacterHeader />
      {tab === 'overview' && (
        <div className="character">
          <section className="character-side" aria-label={t.title}>
            <CharacterStage />
          </section>
          <section className="character-main" aria-label={t.tabs.overview}>
            <OverviewTab />
          </section>
        </div>
      )}
      {tab === 'wardrobe' && <WardrobeTab key={slot ?? 'all'} slot={slot} />}
      {tab === 'achievements' && <AchievementsTab />}
    </main>
  );
}
