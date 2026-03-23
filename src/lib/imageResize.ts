/** 画像リサイズの最大幅（px） */
const MAX_WIDTH = 1200;
/** 画像リサイズの最大高さ（px） */
const MAX_HEIGHT = 1200;
/** JPEG 品質 (0–1) */
const JPEG_QUALITY = 0.85;

/**
 * 画像 Blob を最大サイズ以内にリサイズする。
 * 既に範囲内なら元の Blob をそのまま返す。
 * Canvas で描画し JPEG として出力する。
 */
export async function resizeImage(
  blob: Blob,
  maxWidth = MAX_WIDTH,
  maxHeight = MAX_HEIGHT,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  // リサイズ不要ならそのまま返す
  if (width <= maxWidth && height <= maxHeight) {
    bitmap.close();
    return blob;
  }

  // アスペクト比を維持してスケール計算
  const scale = Math.min(maxWidth / width, maxHeight / height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return blob;
  }

  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  const resized = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  return resized;
}
