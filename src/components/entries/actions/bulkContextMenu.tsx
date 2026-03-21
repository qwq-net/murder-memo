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

interface BulkContextMenuProps {
  entries: MemoEntry[];
  x: number;
  y: number;
  onClose: () => void;
  onDone: () => void;
}

export function BulkContextMenu({ entries, x, y, onClose, onDone }: BulkContextMenuProps) {
  const moveEntryToPanel = useStore((s) => s.moveEntryToPanel);
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const settings = useStore((s) => s.settings);

  const items = useMemo<ContextMenuEntry[]>(() => {
    const ctx = { timelineGroups, memoGroups, moveEntryToPanel, updateEntry, deleteEntry, settings, onDone };

    return [
      ...buildCategoryMoveItems(entries, ctx),
      ...buildGroupMoveItems(entries, ctx),
      ...buildImportanceItems(entries, ctx),
      ...buildDisplayItems(entries, ctx),
      ...buildDeleteItems(entries, ctx),
    ];
  }, [entries, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups, settings, onDone]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
