import { nanoid } from 'nanoid';
import { useCallback, useEffect } from 'react';

import { putImage } from '@/lib/idb';
import { resizeImage } from '@/lib/imageResize';

/**
 * クリップボードからの画像ペーストを検知するフック（戻り値なし）。
 *
 * - document の paste を監視し、クリップボード内の画像をすべて（複数可）リサイズ（最大 1200×1200px）して
 *   IndexedDB に保存し、保存ごとに onImagePaste(blobKey) を呼ぶ
 * - 画像が1枚でもあれば preventDefault する（テキスト等の既定ペーストは抑止）。画像が無ければ何もしない
 * - enabled=false の間はリスナーを張らない（既定 true）
 * - onImagePaste は安定参照（useCallback）で渡すこと。毎レンダー新規だとリスナーが張り直される
 */
export function useClipboardPaste(onImagePaste: (blobKey: string) => void, enabled = true) {
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      // clipboardData は await 後に無効化されるため、画像 Blob を同期的にすべて取り出してから処理する
      const blobs: File[] = [];
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        const blob = item.getAsFile();
        if (blob) blobs.push(blob);
      }
      if (blobs.length === 0) return;
      e.preventDefault();
      for (const blob of blobs) {
        const resized = await resizeImage(blob);
        const blobKey = nanoid();
        await putImage(blobKey, resized);
        onImagePaste(blobKey);
      }
    },
    [onImagePaste],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste, enabled]);
}
