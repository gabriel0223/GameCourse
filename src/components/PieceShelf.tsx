import { GoldAmount } from './GoldAmount';
import { LockIcon, PieceArt } from './PieceArt';
import { Sprite } from './Sprite';
import { GENRE_COLORS } from '../domain/genres';
import type { GamerState } from '../domain/gamer';
import type { Piece, Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';

const t = strings.shop;
const { slots: slotNames, filters: filterNames, equip, equipped, unequip } = strings.character;

export type PieceFilter = 'all' | Slot;
export const PIECE_FILTERS: PieceFilter[] = ['all', 'accessory', 'top', 'bottom'];

// The Shop and the Wardrobe both show a selected piece on her before it's worn for real.
export function tryOn(worn: GamerState['equipped'], piece: Piece | null): GamerState['equipped'] {
  return piece ? { ...worn, [piece.slot]: piece } : worn;
}

interface PieceFiltersProps<Filter> {
  filters: Filter[];
  filter: Filter;
  onChange: (filter: Filter) => void;
}

export function PieceFilters<Filter extends keyof typeof filterNames>({ filters, filter, onChange }: PieceFiltersProps<Filter>) {
  return (
    <div className="chips">
      {filters.map((item) => (
        <button key={item} type="button" aria-pressed={item === filter} onClick={() => onChange(item)}>
          {filterNames[item]}
        </button>
      ))}
    </div>
  );
}

function PieceActions({ piece }: { piece: Piece }) {
  const { gamer, buy, equip: wear } = useLibrary();
  const worn = gamer.equipped[piece.slot]?.id === piece.id;
  if (gamer.owned.has(piece.id)) {
    return (
      <button
        className={worn ? 'button' : 'button button-primary'}
        type="button"
        onClick={() => wear(piece.slot, worn ? null : piece.id)}
      >
        {worn ? unequip : equip}
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

export function PieceDetail({ selected, onClose }: { selected: Piece | null; onClose: () => void }) {
  const { gamer, profile } = useLibrary();
  return (
    <div className="shop-detail" data-open={Boolean(selected)} aria-live="polite">
      {selected ? (
        <>
          <button className="shop-close" type="button" aria-label={t.close} onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
          <div className="shop-detail-sprite">
            <Sprite profile={profile} equipped={tryOn(gamer.equipped, selected)} scale={4} walking />
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
  );
}

interface PieceItemsProps {
  pieces: Piece[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PieceItems({ pieces, selectedId, onSelect }: PieceItemsProps) {
  const { gamer } = useLibrary();
  return (
    <div className="shop-items">
      {pieces.map((piece) => {
        const owned = gamer.owned.has(piece.id);
        const worn = gamer.equipped[piece.slot]?.id === piece.id;
        const locked = !owned && !gamer.available.has(piece.id);
        const state = worn ? equipped : owned ? t.owned : locked ? t.locked : strings.gold(piece.price);
        return (
          <button
            className="shop-item"
            key={piece.id}
            type="button"
            aria-label={`${piece.name}, ${piece.genre}, ${state}`}
            aria-pressed={selectedId === piece.id}
            data-locked={locked}
            onClick={() => onSelect(piece.id)}
          >
            <span className="tile" data-equipped={worn} data-locked={locked} data-selected={selectedId === piece.id}>
              <PieceArt piece={piece} />
              {locked && <LockIcon />}
            </span>
            <span className="shop-item-copy">
              <strong>{piece.name}</strong>
              {owned ? (
                <span data-worn={worn}>{state}</span>
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
  );
}
