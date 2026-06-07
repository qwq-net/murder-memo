import { nanoid } from 'nanoid';
import { useCallback, useEffect } from 'react';

import { deleteImage, putImage } from '@/lib/idb';
import { resizeImage } from '@/lib/imageResize';

/**
 * クリップボードからの画像ペーストを検知するフック（戻り値なし）。
 *
 * - document の paste を監視し、クリップボード内の画像をすべて（複数可）リサイズ（最大 1200×1200px）して
 *   IndexedDB に保存し、保存ごとに onImagePaste(blobKey) を呼ぶ
 * - 画像が1枚でもあれば preventDefault する（テキスト等の既定ペーストは抑止）。画像が無ければ何もしない
 * - enabled=false の間はリスナーを張らない（既定 true）
 * - onImagePaste は安定参照（useCallback）で渡すこと。毎レンダー新規だとリスナーが張り直される
 * - onImagePaste は Promise を返してよい（エントリ追加の完了/失敗を待てる）。1 枚の処理が失敗しても
 *   保存済み blob を後始末（deleteImage）して孤児を残さず、残りの画像処理は継続する
 */
export function useClipboardPaste(
  onImagePaste: (blobKey: string) => void | Promise<void>,
  enabled = true,
) {
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
        let blobKey: string | null = null;
        try {
          const resized = await resizeImage(blob);
          blobKey = nanoid();
          await putImage(blobKey, resized);
          // onImagePaste（=addEntry 経由）の失敗を待って捕捉する。失敗時は下で blob を後始末
          await onImagePaste(blobKey);
        } catch (err) {
          // エントリ追加まで至らなかった場合、保存済み blob を孤児にしないよう削除して継続する
          if (blobKey) await deleteImage(blobKey).catch(() => {});
          console.error('画像ペーストの処理に失敗しました', err);
        }
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
