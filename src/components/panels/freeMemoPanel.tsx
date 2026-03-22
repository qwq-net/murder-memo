import { useCallback } from 'react';

import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { useStore } from '@/store';
import { MemoPanel } from '@/components/panels/memoPanel';

export function FreeMemoPanel() {
  const addEntry = useStore((s) => s.addEntry);
  const addToast = useStore((s) => s.addToast);

  const handleImagePaste = useCallback(
    (blobKey: string) => {
      addEntry({ content: '', panel: 'free', type: 'image', imageBlobKey: blobKey });
      addToast('画像を追加しました');
    },
    [addEntry, addToast],
  );

  // 自由メモパネルのみ画像ペーストを有効化
  useClipboardPaste(handleImagePaste);

  return (
    <MemoPanel
      panel="free"
      accentColor="var(--panel-free-accent)"
      emptyMessage="メモを書き殴ろう"
    />
  );
}
