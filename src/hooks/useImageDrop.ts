import { useCallback, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import { putImage } from '@/lib/idb';
import { resizeImage } from '@/lib/imageResize';
import { useStore } from '@/store';
import type { MemoEntry, PanelId } from '@/types/memo';

/**
 * 画像のドラッグ＆ドロップ + ファイル選択を提供する共通フック。
 * 全パネルで利用可能。
 */
export function useImageDrop(panel: PanelId) {
  const addEntry = useStore((s) => s.addEntry);
  const addToast = useStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  /** 画像 Blob をリサイズして IndexedDB に保存し、エントリを追加 */
  const addImage = useCallback(
    async (blob: Blob) => {
      const resized = await resizeImage(blob);
      const blobKey = nanoid();
      await putImage(blobKey, resized);
      const extra: Partial<MemoEntry> = {};
      if (panel === 'timeline') {
        const groups = useStore.getState().timelineGroups;
        if (groups.length === 0) {
          addToast('先にメモグループを追加してください', 'error');
          return;
        }
        extra.timelineGroupId = groups[0].id;
        // タイムラインでは type: 'timeline' にして TimelineEntry で表示（時刻は不明扱い）
        extra.type = 'timeline';
      }
      addEntry({ content: '', panel, type: extra.type ?? 'image', imageBlobKey: blobKey, ...extra });
      addToast('画像を追加しました');
    },
    [addEntry, addToast, panel],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) addImage(file);
      e.target.value = '';
    },
    [addImage],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) addImage(file);
    },
    [addImage],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    isDragOver,
    fileInputRef,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker,
  };
}
