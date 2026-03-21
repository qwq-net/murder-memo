import { useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

import { putImage } from '../lib/idb';

/**
 * クリップボードからの画像ペーストを検知するフック。
 * FreeMemoPanel の画像ペースト処理を分離。
 */
export function useClipboardPaste(
  onImagePaste: (blobKey: string) => void,
  enabled = true,
) {
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        const blobKey = nanoid();
        await putImage(blobKey, blob);
        onImagePaste(blobKey);
        break;
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
