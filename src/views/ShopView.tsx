import { useState } from 'react';
import type { CSSProperties } from 'react';
import { GoldAmount } from '../components/GoldAmount';
import { PIECE_FILTERS, PieceDetail, PieceFilters, PieceItems, tryOn } from '../components/PieceShelf';
import type { PieceFilter } from '../components/PieceShelf';
import { Sprite } from '../components/Sprite';
import { GENRE_COLORS } from '../domain/genres';
import { PIECES, SLOTS, findPiece } from '../domain/wardrobe';
import type { Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';

const t = strings.shop;

const SHELF: Slot[] = [...SLOTS].reverse();

// Cheapest first, which is also the order they reach the Shop.
const SHOP_ORDER = [...PIECES].sort(
  (a, b) => a.shopLevel - b.shopLevel || SHELF.indexOf(a.slot) - SHELF.indexOf(b.slot),
);

export function ShopView() {
  const { gamer, profile } = useLibrary();
  const [filter, setFilter] = useState<PieceFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = findPiece(selectedId) ?? null;
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
          <Sprite profile={profile} equipped={tryOn(gamer.equipped, selected)} scale={8} walking />
        </div>
        <PieceDetail selected={selected} onClose={() => setSelectedId(null)} />
        <p className="shop-note">{t.earnHint}</p>
      </section>

      <section className="shop-main" aria-label={t.title}>
        <PieceFilters filters={PIECE_FILTERS} filter={filter} onChange={setFilter} />
        <PieceItems pieces={shown} selectedId={selectedId} onSelect={setSelectedId} />
      </section>
    </main>
  );
}
