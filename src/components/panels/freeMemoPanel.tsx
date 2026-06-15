import { useCallback } from 'react';

import { MemoPanel } from '@/components/panels/memoPanel';
import { useT } from '@/i18n';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { useStore } from '@/store';

export function FreeMemoPanel() {
  const t = useT();
  const addEntry = useStore((s) => s.addEntry);
  const addToast = useStore((s) => s.addToast);

  const handleImagePaste = useCallback(
    async (blobKey: string) => {
      // addEntry の保存成功を待ってから成功トーストを出す。失敗時は addEntry が
      // ロールバック＋エラートーストし throw するため、useClipboardPaste 側が blob を後始末する
      await addEntry({ content: '', panel: 'free', type: 'image', imageBlobKey: blobKey });
      addToast(t('panels.imageAdded'));
    },
    [addEntry, addToast, t],
  );

  // 自由メモパネルのみクリップボード画像ペーストを有効化
  useClipboardPaste(handleImagePaste);

  return (
    <MemoPanel panel="free" accentColor="var(--panel-free-accent)" emptyMessage={t('panels.emptyFree')} />
  );
}
