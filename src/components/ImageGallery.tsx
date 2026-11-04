import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { GameImage } from '../domain/types';
import { strings } from '../strings';

const t = strings.game;
const SHOWN_AT_FIRST = 6;

const imageUrl = (id: string, size: 't_screenshot_big' | 't_1080p') =>
  `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;

interface ViewerProps {
  title: string;
  game: string;
  images: GameImage[];
  index: number;
  onMove(index: number): void;
  onClose(): void;
}

function ImageViewer({ title, game, images, index, onMove, onClose }: ViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = images[index];
  const several = images.length > 1;
  const step = (change: number) => onMove((index + change + images.length) % images.length);

  // The browser's own modal handles focus, Escape, and blocking the page behind it.
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function moveWithKeys(event: KeyboardEvent) {
    if (!several) return;
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  }

  return (
    <dialog
      ref={dialog}
      className="image-viewer"
      aria-label={title}
      onClose={onClose}
      onKeyDown={moveWithKeys}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="image-viewer-stage">
        <div className="image-viewer-top">
          <span aria-live="polite">{t.imageCount(index + 1, images.length)}</span>
          <button className="button button-quiet" type="button" onClick={onClose}>
            {t.closeImage}
          </button>
        </div>
        <div
          className="image-viewer-body"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <img key={image.id} src={imageUrl(image.id, 't_1080p')} alt={t.imageAlt(game, title, index + 1)} />
          {several && (
            <>
              <button
                className="image-viewer-arrow image-viewer-previous"
                type="button"
                aria-label={t.previousImage}
                onClick={() => step(-1)}
              >
                ‹
              </button>
              <button
                className="image-viewer-arrow image-viewer-next"
                type="button"
                aria-label={t.nextImage}
                onClick={() => step(1)}
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

export function ImageGallery({ title, game, images }: { title: string; game: string; images: GameImage[] }) {
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const shown = showAll ? images : images.slice(0, SHOWN_AT_FIRST);

  return (
    <section className="game-extra">
      <div className="game-extra-head">
        <h2>{title}</h2>
        {!showAll && images.length > SHOWN_AT_FIRST && (
          <button className="button button-quiet" type="button" onClick={() => setShowAll(true)}>
            {t.showAllImages(images.length)}
          </button>
        )}
      </div>
      <div className="image-grid">
        {shown.map((image, index) => (
          <button className="image-tile" key={image.id} type="button" onClick={() => setOpen(index)}>
            <img src={imageUrl(image.id, 't_screenshot_big')} alt={t.imageAlt(game, title, index + 1)} loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && (
        <ImageViewer title={title} game={game} images={images} index={open} onMove={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
