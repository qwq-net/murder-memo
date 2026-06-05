import { nanoid } from 'nanoid';
import { useCallback, useRef, useState } from 'react';

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

  /** 画像 Blob をリサイズして IndexedDB に保存し、エントリを追加する。成功したら true を返す */
  const addImage = useCallback(
    async (blob: Blob): Promise<boolean> => {
      const extra: Partial<MemoEntry> = {};
      if (panel === 'timeline') {
        // 画像を IDB に保存する前にグループ有無を確認する。
        // 先に putImage すると、ここで return した場合に参照されない孤児 blob が IDB に残る
        const groups = useStore.getState().timelineGroups;
        if (groups.length === 0) {
          addToast('先にメモグループを追加してください', 'error');
          return false;
        }
        extra.timelineGroupId = groups[0].id;
        // タイムラインでは type: 'timeline' にして TimelineEntry で表示（時刻は不明扱い）
        extra.type = 'timeline';
      }
      const resized = await resizeImage(blob);
      const blobKey = nanoid();
      await putImage(blobKey, resized);
      addEntry({
        content: '',
        panel,
        type: extra.type ?? 'image',
        imageBlobKey: blobKey,
        ...extra,
      });
      return true;
    },
    [addEntry, addToast, panel],
  );

  /**
   * ファイル群から画像ファイルだけを順次すべて追加する（複数選択・複数ドロップ対応）。
   * 非画像ファイルは無視する。成功件数に応じてトーストを1回だけ出す。
   */
  const addImageFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;
      let added = 0;
      for (const file of images) {
        // 失敗（タイムラインのグループ未作成など）は以降も同条件で失敗するため打ち切る
        const ok = await addImage(file);
        if (!ok) break;
        added += 1;
      }
      if (added > 0) {
        addToast(added === 1 ? '画像を追加しました' : `画像を ${added} 件追加しました`);
      }
    },
    [addImage, addToast],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void addImageFiles(e.target.files);
      e.target.value = '';
    },
    [addImageFiles],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // drop 後に後追いの dragleave が発火してもカウンタが負に陥らないようガードする
    // （負になると次のドラッグで isDragOver が解除されずオーバーレイが張り付く）
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
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
      void addImageFiles(e.dataTransfer.files);
    },
    [addImageFiles],
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
