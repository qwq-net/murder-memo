import { useMemo } from 'react';

import { useStore } from '@/store';
import type { MenuContext } from '@/components/entries/actions/menuItems';

/**
 * コンテキストメニュー用の共通ストアセレクタをまとめて取得するフック。
 * EntryContextMenu / BulkContextMenu で利用。
 */
export function useMenuContext(onDone?: () => void): MenuContext {
  const moveEntryToPanel = useStore((s) => s.moveEntryToPanel);
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const settings = useStore((s) => s.settings);
  const addToast = useStore((s) => s.addToast);

  return useMemo(
    () => ({ moveEntryToPanel, updateEntry, deleteEntry, addEntry, timelineGroups, memoGroups, settings, addToast, onDone }),
    [moveEntryToPanel, updateEntry, deleteEntry, addEntry, timelineGroups, memoGroups, settings, addToast, onDone],
  );
}
