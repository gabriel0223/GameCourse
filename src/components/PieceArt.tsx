import type { CSSProperties } from 'react';
import { GENRE_COLORS } from '../domain/genres';
import type { Piece, Slot } from '../domain/wardrobe';
import { spriteUrl } from './Sprite';

const ART_OFFSET: Record<Exclude<Slot, 'accessory'>, number> = { top: -54, bottom: -66 };

// Accessories sit anywhere from the crown of the head to the chin, so each has its own offset.
const ACCESSORY_OFFSET: Record<string, number> = {
  'acc-action': -11,
  'acc-adventure': 7,
  'acc-cozy': 4,
  'acc-horror': -20,
  'acc-platform': 1,
  'acc-puzzle': 1,
  'acc-racing': -5,
  'acc-rpg': 13,
  'acc-shooter': -17,
  'acc-strategy': 13,
};

function artOffset(piece: Piece): number {
  return piece.slot === 'accessory' ? (ACCESSORY_OFFSET[piece.id] ?? 0) : ART_OFFSET[piece.slot];
}

export function LockIcon() {
  return (
    <svg className="tile-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

// Each piece sits at a different height on the sprite, so its art moves to the middle of the tile.
export function PieceArt({ piece }: { piece: Piece }) {
  return (
    <>
      <span className="tile-tint" style={{ background: GENRE_COLORS[piece.genre] }} />
      <span className="tile-art">
        <img src={spriteUrl(piece.id)} alt="" style={{ '--art-offset': `${artOffset(piece)}px` } as CSSProperties} />
      </span>
      <span className="tile-genre" style={{ background: GENRE_COLORS[piece.genre] }} />
    </>
  );
}
