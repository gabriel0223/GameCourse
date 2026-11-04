import type { CSSProperties } from 'react';
import type { CharacterProfile, Piece, Slot } from '../domain/wardrobe';

const FILES = import.meta.glob('../assets/sprites/*.png', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>;

export const spriteUrl = (name: string) => FILES[`../assets/sprites/${name}.png`];

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 22;
const FRAMES = 5;

interface SpriteProps {
  profile: CharacterProfile;
  equipped: Record<Slot, Piece | null>;
  scale: number;
  walking?: boolean;
}

// Layers are five-frame strips. Moving one wrapper keeps them perfectly in sync.
export function Sprite({ profile, equipped, scale, walking = false }: SpriteProps) {
  const width = FRAME_WIDTH * scale;
  const height = FRAME_HEIGHT * scale;
  const layers = [
    `base-${profile.skin}`,
    equipped.bottom?.id,
    equipped.top?.id,
    `hair-${profile.hairStyle}-${profile.hairColor}`,
    equipped.accessory?.id,
  ].filter((layer): layer is string => Boolean(layer));

  return (
    <div
      className={`sprite${walking ? ' sprite-walking' : ''}`}
      style={{ width, height, '--frame': `${width}px` } as CSSProperties}
    >
      <div className="sprite-strip" style={{ width: width * FRAMES, height }}>
        {layers.map((layer) => (
          <img key={layer} src={spriteUrl(layer)} alt="" />
        ))}
      </div>
    </div>
  );
}
