import { useMemo } from 'react';

import type { MenuContext } from '@/components/entries/actions/menuItems';
import { useT } from '@/i18n';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';

/**
 * コンテキストメニュー用の共通ストアセレクタをまとめて取得するフック。
 * EntryContextMenu / BulkContextMenu で利用。
 */
export function useMenuContext(onDone?: () => void): MenuContext {
  const moveEntryToPanel = useStore((s) => s.moveEntryToPanel);
  const updateEntry = useStore((s) => s.updateEntry);
  const setEntryGroup = useStore((s) => s.setEntryGroup);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const addEntry = useStore((s) => s.addEntry);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);
  const allCharacters = useStore((s) => s.characters);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const settings = useStore((s) => s.settings);
  const addToast = useStore((s) => s.addToast);
  const t = useT();
  const layout = useStore(selectResolvedLayout);
  const hiddenPanels = useMemo(() => layout.hidden, [layout]);

  // showInEntries が true のキャラのみ。プレイヤー → NPC、sortOrder 順
  const characters = useMemo(
    () =>
      allCharacters
        .filter((c) => c.showInEntries)
        .sort((a, b) => {
          if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        }),
    [allCharacters],
  );

  return useMemo(
    () => ({
      t,
      moveEntryToPanel,
      updateEntry,
      setEntryGroup,
      deleteEntry,
      addEntry,
      toggleCharacterTag,
      characters,
      timelineGroups,
      memoGroups,
      hiddenPanels,
      settings,
      addToast,
      onDone,
    }),
    [
      t,
      moveEntryToPanel,
      updateEntry,
      setEntryGroup,
      deleteEntry,
      addEntry,
      toggleCharacterTag,
      characters,
      timelineGroups,
      memoGroups,
      hiddenPanels,
      settings,
      addToast,
      onDone,
    ],
  );
}
