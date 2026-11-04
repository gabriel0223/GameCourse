import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Sprite, spriteUrl } from '../components/Sprite';
import { hrefs } from '../useHashRoute';
import { ACHIEVEMENT_XP } from '../domain/gamer';
import type { AchievementGroup } from '../domain/gamer';
import { GENRE_COLORS } from '../domain/genres';
import { HAIRSTYLES, HAIR_COLORS, NAME_LIMIT, PIECES, SKIN_TONES, SLOTS, cleanName, findPiece } from '../domain/wardrobe';
import type { Piece, Slot } from '../domain/wardrobe';
import { formatDuration } from '../format';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';

const t = strings.character;
type Tab = keyof typeof t.tabs;
type Filter = 'all' | Slot;

const TABS: Tab[] = ['profile', 'inventory', 'appearance', 'achievements'];
const FILTERS: Filter[] = ['all', 'accessory', 'top', 'bottom'];
const GROUPS: AchievementGroup[] = ['Library', 'Finishing', 'Exploring', 'Character', 'Codex', 'Practice'];
const ART_OFFSET: Record<Slot, number> = { accessory: 15, top: -54, bottom: -66 };

export function LockIcon() {
  return (
    <svg className="tile-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4 2h8v1h2.5v2.2a3 3 0 0 1-2.8 2.9A4 4 0 0 1 9 10.3V12h2v2H5v-2h2v-1.7a4 4 0 0 1-2.7-2.2 3 3 0 0 1-2.8-2.9V3H4V2Zm0 2.5H3v.7c0 .7.4 1.2 1 1.4V4.5Zm8 0v2.1c.6-.2 1-.7 1-1.4v-.7h-1Z"
      />
    </svg>
  );
}

export function PieceArt({ piece }: { piece: Piece }) {
  return (
    <>
      <span className="tile-tint" style={{ background: GENRE_COLORS[piece.genre] }} />
      <span className="tile-art">
        <img src={spriteUrl(piece.id)} alt="" style={{ marginTop: ART_OFFSET[piece.slot] }} />
      </span>
      <span className="tile-genre" style={{ background: GENRE_COLORS[piece.genre] }} />
    </>
  );
}

function EquipmentPanel({ selected, onSlot }: { selected: Piece | null; onSlot(slot: Slot): void }) {
  const { gamer, profile } = useLibrary();
  const favorite = gamer.stats.favoriteGenre;
  const glow = favorite ? GENRE_COLORS[favorite] : '#8b7cf6';

  return (
    <section className="character-side" aria-label={t.title}>
      <div className="character-heading">
        <h1>{profile.characterName || t.title}</h1>
      </div>
      <div className="character-stage-row">
        <div className="stage" style={{ '--glow': glow } as CSSProperties}>
          <span className="stage-floor" />
          <span className="stage-shadow" />
          <Sprite profile={profile} equipped={gamer.equipped} scale={12} walking />
        </div>
        <div className="equip-slots">
          {SLOTS.map((slot) => {
            const piece = gamer.equipped[slot];
            return (
              <div className="equip-slot" key={slot}>
                {t.slots[slot]}
                <button
                  className="tile"
                  type="button"
                  aria-label={`${t.slots[slot]}: ${piece ? piece.name : t.empty}`}
                  data-equipped={Boolean(piece)}
                  data-selected={Boolean(piece && selected?.id === piece.id)}
                  onClick={() => onSlot(slot)}
                >
                  {piece ? <PieceArt piece={piece} /> : <span className="tile-empty">{t.empty}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProfileTab() {
  const { gamer } = useLibrary();
  const { stats } = gamer;
  const genres = [...gamer.genres].sort((a, b) => b.total - a.total);
  const favorite = stats.favoriteGenre;
  return (
    <>
      <h2 className="section-title">{t.gamerProfile}</h2>
      <dl className="stat-grid">
        <div className="stat stat-wide">
          <dt>{t.stats.favoriteGenre}</dt>
          <dd className="stat-feature" style={favorite ? { color: GENRE_COLORS[favorite] } : undefined}>
            {favorite ?? t.stats.notYet}
          </dd>
        </div>
        <div className="stat stat-wide">
          <dt>{t.stats.mostPlayed}</dt>
          <dd className="stat-feature">{stats.mostPlayed?.name ?? t.stats.notYet}</dd>
        </div>
        <div className="stat">
          <dt>{t.stats.hours}</dt>
          <dd>{Math.floor(stats.minutesPlayed / 60)}</dd>
        </div>
        <div className="stat">
          <dt>{t.stats.finished}</dt>
          <dd>{stats.gamesFinished}</dd>
        </div>
        <div className="stat">
          <dt>{t.stats.achievements}</dt>
          <dd>
            {gamer.earnedCount} / {gamer.achievements.length}
          </dd>
        </div>
        <div className="stat">
          <dt>{t.stats.genres}</dt>
          <dd>
            {stats.genresExplored} / {gamer.genres.length}
          </dd>
        </div>
      </dl>
      <h2 className="section-title">{t.genreLevels}</h2>
      <ul className="genre-list">
        {genres.map((item) => (
          <li key={item.genre}>
            <div className="genre-row-top">
              <span style={{ color: GENRE_COLORS[item.genre] }}>{item.genre}</span>
              <span>
                {strings.level} {item.level}
              </span>
            </div>
            <div className="genre-bar">
              <span
                style={{
                  width: `${Math.round((item.intoLevel / item.needed) * 100)}%`,
                  background: GENRE_COLORS[item.genre],
                }}
              />
            </div>
            <div className="genre-row-bottom">
              <span>
                {item.nextPiece ? t.nextUnlock(item.nextPiece.name, item.nextPiece.shopLevel) : t.allUnlocked}
              </span>
              {item.minutes > 0 && <span>{formatDuration(item.minutes)}</span>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ItemDetail({ piece }: { piece: Piece | null }) {
  const { gamer, equip } = useLibrary();
  if (!piece) return <div className="item-detail">{t.pickHint}</div>;
  const worn = gamer.equipped[piece.slot]?.id === piece.id;
  return (
    <div className="item-detail">
      <div className="tile">
        <PieceArt piece={piece} />
      </div>
      <div className="item-detail-copy">
        <h2>{piece.name}</h2>
        <p className="item-meta" style={{ color: GENRE_COLORS[piece.genre] }}>
          {piece.genre} · {t.slots[piece.slot]}
        </p>
        <p>{piece.blurb}</p>
      </div>
      <button
        className={worn ? 'button' : 'button button-primary'}
        type="button"
        onClick={() => equip(piece.slot, worn ? null : piece.id)}
      >
        {worn ? t.unequip : t.equip}
      </button>
    </div>
  );
}

interface InventoryProps {
  filter: Filter;
  setFilter(filter: Filter): void;
  selected: Piece | null;
  setSelected(piece: Piece): void;
}

function InventoryTab({ filter, setFilter, selected, setSelected }: InventoryProps) {
  const { gamer, equip } = useLibrary();
  const visible = PIECES.filter((piece) => gamer.owned.has(piece.id) && (filter === 'all' || piece.slot === filter));
  return (
    <>
      <div className="inventory-top">
        <div className="chips">
          {FILTERS.map((item) => (
            <button key={item} type="button" aria-pressed={item === filter} onClick={() => setFilter(item)}>
              {t.filters[item]}
            </button>
          ))}
        </div>
        <span className="count">{t.ownedCount(gamer.owned.size, PIECES.length)}</span>
      </div>
      {gamer.owned.size === 0 ? (
        <div className="item-detail inventory-empty">
          <span>{t.emptyInventory}</span>
          <a className="button button-primary button-link" href={hrefs.shop}>
            {t.goShop}
          </a>
        </div>
      ) : (
        <>
          <ItemDetail piece={selected} />
          <div className="tile-grid">
            {visible.map((piece) => {
              const worn = gamer.equipped[piece.slot]?.id === piece.id;
              return (
                <button
                  className="tile"
                  key={piece.id}
                  type="button"
                  aria-label={`${piece.name}, ${piece.genre}${worn ? `, ${t.equippedLabel}` : ''}`}
                  aria-pressed={selected?.id === piece.id}
                  data-equipped={worn}
                  data-selected={selected?.id === piece.id}
                  onClick={() => setSelected(piece)}
                  onDoubleClick={() => equip(piece.slot, worn ? null : piece.id)}
                >
                  <PieceArt piece={piece} />
                  {worn && <span className="tile-badge">E</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function NameField() {
  const { profile, setCharacterName } = useLibrary();
  const [name, setName] = useState(profile.characterName);
  return (
    <section>
      <h2>
        <label htmlFor="character-name">{t.name}</label>
      </h2>
      <div className="character-name">
        <input
          id="character-name"
          type="text"
          autoComplete="off"
          maxLength={NAME_LIMIT}
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            setName(cleanName(name));
            setCharacterName(name);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </div>
    </section>
  );
}

function AppearanceTab() {
  const { profile, setAppearance } = useLibrary();
  return (
    <div className="appearance">
      <NameField />
      <section>
        <h2>{t.hairstyle}</h2>
        <div className="hair-options">
          {HAIRSTYLES.map((style) => (
            <div className="hair-option" key={style.id}>
              <button
                className="tile"
                type="button"
                aria-label={`${style.name} hairstyle`}
                aria-pressed={profile.hairStyle === style.id}
                data-selected={profile.hairStyle === style.id}
                onClick={() => setAppearance({ hairStyle: style.id })}
              >
                <span className="tile-art hair-preview">
                  <img src={spriteUrl(`base-${profile.skin}`)} alt="" />
                  <img src={spriteUrl(`hair-${style.id}-${profile.hairColor}`)} alt="" />
                </span>
              </button>
              {style.name}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>{t.hairColor}</h2>
        <div className="swatches">
          {HAIR_COLORS.map((color) => (
            <button
              className="swatch"
              key={color.id}
              type="button"
              aria-label={`${color.name} hair`}
              aria-pressed={profile.hairColor === color.id}
              style={{ background: color.color }}
              onClick={() => setAppearance({ hairColor: color.id })}
            />
          ))}
        </div>
      </section>
      <section>
        <h2>{t.skinTone}</h2>
        <div className="swatches">
          {SKIN_TONES.map((tone) => (
            <button
              className="swatch"
              key={tone.id}
              type="button"
              aria-label={`${tone.name} skin tone`}
              aria-pressed={profile.skin === tone.id}
              style={{ background: tone.color }}
              onClick={() => setAppearance({ skin: tone.id })}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AchievementsTab() {
  const { gamer } = useLibrary();
  return (
    <>
      <p className="count">{t.achievementsSummary(gamer.earnedCount, gamer.achievements.length)}</p>
      {GROUPS.map((group) => (
        <section className="achievement-group" key={group}>
          <h2>{group}</h2>
          <ul className="achievement-list">
            {gamer.achievements
              .filter((item) => item.group === group)
              .map((item) => (
                <li className="achievement" key={item.id} data-earned={item.unlocked}>
                  <span className="achievement-mark">
                    <TrophyIcon />
                  </span>
                  <span>
                    <span className="achievement-title">
                      {item.title}
                      {item.unlocked && <span className="sr-only"> ({t.earned})</span>}
                    </span>
                    <span className="achievement-description">{item.description}</span>
                  </span>
                  <span className="achievement-xp">{t.achievementReward(ACHIEVEMENT_XP, item.gold)}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function CharacterView() {
  const { gamer } = useLibrary();
  const [tab, setTab] = useState<Tab>('profile');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = findPiece(selectedId) ?? null;

  function openSlot(slot: Slot) {
    setTab('inventory');
    setFilter(slot);
    setSelectedId(gamer.equipped[slot]?.id ?? null);
  }

  return (
    <main className="page character">
      <EquipmentPanel selected={selected} onSlot={openSlot} />
      <section className="character-main" aria-label={t.tabs[tab]}>
        <div className="tabs">
          {TABS.map((item) => (
            <button key={item} type="button" aria-pressed={item === tab} onClick={() => setTab(item)}>
              {t.tabs[item]}
            </button>
          ))}
        </div>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'inventory' && (
          <InventoryTab
            filter={filter}
            setFilter={setFilter}
            selected={selected}
            setSelected={(piece) => setSelectedId(piece.id)}
          />
        )}
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'achievements' && <AchievementsTab />}
      </section>
    </main>
  );
}
