import { useState } from 'react';
import type { CSSProperties } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { Sprite } from '../components/Sprite';
import { GENRE_COLORS } from '../domain/genres';
import { PIECES, SLOTS, findPiece } from '../domain/wardrobe';
import type { Piece, Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { LockIcon, PieceArt } from './CharacterView';

const t = strings.shop;
const { slots: slotNames, filters: filterNames } = strings.character;

type Filter = 'all' | Slot;
const FILTERS: Filter[] = ['all', 'accessory', 'top', 'bottom'];
const SHELF: Slot[] = [...SLOTS].reverse();

// Cheapest first, which is also the order they reach the Shop.
const SHOP_ORDER = [...PIECES].sort(
  (a, b) => a.shopLevel - b.shopLevel || SHELF.indexOf(a.slot) - SHELF.indexOf(b.slot),
);

function PieceActions({ piece }: { piece: Piece }) {
  const { gamer, buy, equip } = useLibrary();
  const worn = gamer.equipped[piece.slot]?.id === piece.id;
  if (gamer.owned.has(piece.id)) {
    return (
      <button
        className={worn ? 'button' : 'button button-primary'}
        type="button"
        onClick={() => equip(piece.slot, worn ? null : piece.id)}
      >
        {worn ? strings.character.unequip : strings.character.equip}
      </button>
    );
  }
  if (!gamer.available.has(piece.id)) return <p className="shop-note">{t.lockedHint(piece.genre, piece.shopLevel)}</p>;
  const missing = piece.price - gamer.gold.balance;
  return (
    <>
      <button className="button button-primary" type="button" disabled={missing > 0} onClick={() => buy(piece)}>
        {t.buy(piece.price)}
      </button>
      {missing > 0 && <p className="shop-note">{t.needMore(missing)}</p>}
    </>
  );
}

export function ShopView() {
  const { gamer, profile } = useLibrary();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = findPiece(selectedId) ?? null;
  const tryingOn = selected ? { ...gamer.equipped, [selected.slot]: selected } : gamer.equipped;
  const favorite = gamer.stats.favoriteGenre;

  const shown = SHOP_ORDER.filter((piece) => filter === 'all' || piece.slot === filter);

  return (
    <main className="page shop" data-detail={Boolean(selected)}>
      <section className="shop-side" aria-label={t.tryOn}>
        <div className="character-heading">
          <h1>{t.title}</h1>
          <p className="shop-balance">
            <span className="sr-only">{t.balance}: </span>
            <GoldAmount amount={gamer.gold.balance} />
          </p>
        </div>
        <div className="stage" style={{ '--glow': selected ? GENRE_COLORS[selected.genre] : favorite ? GENRE_COLORS[favorite] : '#8b7cf6' } as CSSProperties}>
          <span className="stage-floor" />
          <span className="stage-shadow" />
          <Sprite profile={profile} equipped={tryingOn} scale={8} walking />
        </div>
        <div className="shop-detail" data-open={Boolean(selected)} aria-live="polite">
          {selected ? (
            <>
              <button className="shop-close" type="button" aria-label={t.close} onClick={() => setSelectedId(null)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
              <div className="shop-detail-sprite">
                <Sprite profile={profile} equipped={tryingOn} scale={4} walking />
              </div>
              <div className="shop-detail-copy">
                <p className="eyebrow">{t.tryOn}</p>
                <h2>{selected.name}</h2>
                <p className="item-meta" style={{ color: GENRE_COLORS[selected.genre] }}>
                  {selected.genre} · {slotNames[selected.slot]}
                </p>
                <p className="shop-blurb">{selected.blurb}</p>
              </div>
              <div className="shop-detail-actions">
                <PieceActions piece={selected} />
              </div>
            </>
          ) : (
            <p className="shop-note">{t.pick}</p>
          )}
        </div>
        <p className="shop-note">{t.earnHint}</p>
      </section>

      <section className="shop-main" aria-label={t.title}>
        <div className="chips">
          {FILTERS.map((item) => (
            <button key={item} type="button" aria-pressed={item === filter} onClick={() => setFilter(item)}>
              {filterNames[item]}
            </button>
          ))}
        </div>
        <div className="shop-items">
          {shown.map((piece) => {
            const owned = gamer.owned.has(piece.id);
            const locked = !owned && !gamer.available.has(piece.id);
            const state = owned ? t.owned : locked ? t.locked : strings.gold(piece.price);
            return (
              <button
                className="shop-item"
                key={piece.id}
                type="button"
                aria-label={`${piece.name}, ${piece.genre}, ${state}`}
                aria-pressed={selected?.id === piece.id}
                data-locked={locked}
                onClick={() => setSelectedId(piece.id)}
              >
                <span className="tile" data-locked={locked} data-selected={selected?.id === piece.id}>
                  <PieceArt piece={piece} />
                  {locked && <LockIcon />}
                </span>
                <span className="shop-item-copy">
                  <strong>{piece.name}</strong>
                  {owned ? (
                    <span>{t.owned}</span>
                  ) : locked ? (
                    <span>{t.levelNeeded(piece.genre, piece.shopLevel)}</span>
                  ) : (
                    <GoldAmount amount={piece.price} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
