import type { CSSProperties } from 'react';
import { PieceArt } from '../components/PieceArt';
import { tryOn } from '../components/PieceShelf';
import { Sprite } from '../components/Sprite';
import { GENRE_COLORS } from '../domain/genres';
import { SLOTS } from '../domain/wardrobe';
import type { Piece, Slot } from '../domain/wardrobe';
import { useLibrary } from '../state/LibraryContext';
import { strings } from '../strings';
import { hrefs } from '../useHashRoute';

const t = strings.character;

interface CharacterStageProps {
  slot?: Slot | null;
  preview?: Piece | null;
}

export function CharacterStage({ slot = null, preview = null }: CharacterStageProps) {
  const { gamer, profile } = useLibrary();
  const favorite = gamer.stats.favoriteGenre;
  const glow = preview ? GENRE_COLORS[preview.genre] : favorite ? GENRE_COLORS[favorite] : '#8b7cf6';

  return (
    <div className="stage" style={{ '--glow': glow } as CSSProperties}>
      <span className="stage-floor" />
      <span className="stage-shadow" />
      <Sprite profile={profile} equipped={tryOn(gamer.equipped, preview)} scale={14} walking />
      {/* Listed top to bottom, so each slot sits beside the part of her body it dresses. */}
      <div className="equip-slots">
        {SLOTS.map((item) => {
          const piece = gamer.equipped[item];
          return (
            <div className="equip-slot" key={item} data-slot={item}>
              {t.slots[item]}
              <a
                className="tile"
                aria-label={`${t.slots[item]}: ${piece ? piece.name : t.empty}`}
                href={hrefs.characterSlot(item)}
                data-equipped={Boolean(piece)}
                data-selected={item === slot}
              >
                {piece ? <PieceArt piece={piece} /> : <span className="tile-empty">{t.empty}</span>}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
