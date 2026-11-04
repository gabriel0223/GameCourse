import { describe, expect, it } from 'vitest';
import { MAX_GIF_BYTES, isGifTooLarge, prepareImage } from './imageUpload';

const file = (size: number, type: string) => new File([new Uint8Array(size)], 'clip', { type });

describe('image uploads', () => {
  it('keeps a GIF exactly as it is, so it stays animated', async () => {
    const gif = file(10, 'image/gif');
    expect(await prepareImage(gif)).toBe(gif);
  });

  it('only limits the size of GIFs', () => {
    expect(isGifTooLarge(file(MAX_GIF_BYTES + 1, 'image/gif'))).toBe(true);
    expect(isGifTooLarge(file(MAX_GIF_BYTES, 'image/gif'))).toBe(false);
    expect(isGifTooLarge(file(MAX_GIF_BYTES + 1, 'image/png'))).toBe(false);
  });
});
