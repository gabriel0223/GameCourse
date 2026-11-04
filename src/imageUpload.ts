const MAX_SIZE = 1600;
const QUALITY = 0.86;

// Large photos are shrunk before saving, which keeps guides quick to open.
export async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Image export failed'))), type, QUALITY);
  });
}

export function pastedImage(data: DataTransfer | null): File | null {
  const files = Array.from(data?.files ?? []);
  return files.find((file) => file.type.startsWith('image/')) ?? null;
}

// Selecting part of a page copies a link to the picture, which sites rarely let another page download.
export const copiedPageImage = (data: DataTransfer | null) => /<img\s/i.test(data?.getData('text/html') ?? '');
