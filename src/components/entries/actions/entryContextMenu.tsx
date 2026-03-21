import { useMemo } from 'react';

import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import type { ContextMenuEntry } from '@/components/common/contextMenu';
import { ContextMenu } from '@/components/common/contextMenu';
import {
  buildCategoryMoveItems,
  buildDeleteItems,
  buildDisplayItems,
  buildGroupMoveItems,
  buildImportanceItems,
} from '@/components/entries/actions/menuItems';

interface EntryContextMenuProps {
  entry: MemoEntry;
  x: number;
  y: number;
  onClose: () => void;
}

export function EntryContextMenu({ entry, x, y, onClose }: EntryContextMenuProps) {
  const moveEntryToPanel = useStore((s) => s.moveEntryToPanel);
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const settings = useStore((s) => s.settings);

  const items = useMemo<ContextMenuEntry[]>(() => {
    const entries = [entry];
    const ctx = { timelineGroups, memoGroups, moveEntryToPanel, updateEntry, deleteEntry, settings };

    const result: ContextMenuEntry[] = [
      ...buildCategoryMoveItems(entries, ctx),
      ...buildGroupMoveItems(entries, ctx),
      ...buildImportanceItems(entries, ctx),
      ...buildDisplayItems(entries, ctx),
    ];

    // ── タイムライン固有: 時刻トグル ──
    if (entry.panel === 'timeline') {
      const hasTime = entry.eventTime != null;
      result.push(
        { separator: true as const },
        {
          label: hasTime ? '不明にする' : '時刻を設定',
          onClick: () => {
            if (hasTime) {
              updateEntry(entry.id, { eventTime: undefined, eventTimeSortKey: undefined });
            } else {
              updateEntry(entry.id, {});
              const { setFocusedEntry } = useStore.getState();
              setFocusedEntry(entry.id);
            }
          },
        },
      );
    }

    result.push(...buildDeleteItems(entries, ctx));

    return result;
  }, [entry, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups, settings]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
