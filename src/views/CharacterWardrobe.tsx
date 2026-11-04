import { useState } from 'react';
import { PIECE_FILTERS, PieceDetail, PieceFilters, PieceItems } from '../components/PieceShelf';
import type { PieceFilter } from '../components/PieceShelf';
import { spriteUrl } from '../components/Sprite';
import { HAIRSTYLES, HAIR_COLORS, PIECES, SKIN_TONES, findPiece } from '../domain/wardrobe';
import type { Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';
import { CharacterStage } from './CharacterStage';

const t = strings.character;

type WardrobeFilter = PieceFilter | 'looks';
const FILTERS: WardrobeFilter[] = [...PIECE_FILTERS, 'looks'];

function Looks() {
  const { profile, setAppearance } = useLibrary();
  return (
    <div className="appearance">
      <div>
        <h3>{t.hairstyle}</h3>
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
      </div>
      <div>
        <h3>{t.hairColor}</h3>
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
      </div>
      <div>
        <h3>{t.skinTone}</h3>
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
      </div>
    </div>
  );
}

export function WardrobeTab({ slot }: { slot: Slot | null }) {
  const { gamer } = useLibrary();
  const [filter, setFilter] = useState<WardrobeFilter>(slot ?? 'all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = findPiece(selectedId) ?? null;
  const owned = PIECES.filter((piece) => gamer.owned.has(piece.id) && (filter === 'all' || piece.slot === filter));

  return (
    <div className="character" data-detail={Boolean(selected)}>
      <section className="character-side" aria-label={strings.shop.tryOn}>
        <CharacterStage slot={slot} preview={selected} />
        <PieceDetail selected={selected} onClose={() => setSelectedId(null)} />
      </section>
      <section className="character-main" aria-label={t.tabs.wardrobe}>
        <section className="character-section">
          <header className="character-section-head">
            <h2>{filter === 'looks' ? t.looks : t.outfit}</h2>
            {filter !== 'looks' && <span className="count">{t.ownedCount(gamer.owned.size, PIECES.length)}</span>}
          </header>
          <PieceFilters filters={FILTERS} filter={filter} onChange={setFilter} />
          {filter === 'looks' ? (
            <Looks />
          ) : (
            <>
              {owned.length > 0 ? (
                <PieceItems pieces={owned} selectedId={selectedId} onSelect={setSelectedId} />
              ) : (
                <p className="empty-small wardrobe-empty">{t.noPieces}</p>
              )}
              <a className="wardrobe-more" href={hrefs.shop}>
                {t.findInShop}
              </a>
            </>
          )}
        </section>
      </section>
    </div>
  );
}
