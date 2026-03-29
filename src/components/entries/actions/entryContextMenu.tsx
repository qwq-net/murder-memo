import { useMemo } from 'react';

import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import type { ContextMenuEntry } from '@/components/common/contextMenu';
import { ContextMenu } from '@/components/common/contextMenu';
import {
  buildDeleteItems,
  buildDisplaySubmenu,
  buildDuplicateItems,
  buildImportanceSubmenu,
  buildMoveSubmenu,
  buildTagSubmenu,
} from '@/components/entries/actions/menuItems';
import { useMenuContext } from '@/hooks/useMenuContext';

interface EntryContextMenuProps {
  entry: MemoEntry;
  x: number;
  y: number;
  onClose: () => void;
}

export function EntryContextMenu({ entry, x, y, onClose }: EntryContextMenuProps) {
  const ctx = useMenuContext();

  const items = useMemo<ContextMenuEntry[]>(() => {
    const entries = [entry];

    const result: ContextMenuEntry[] = [
      ...buildMoveSubmenu(entries, ctx),
      ...buildImportanceSubmenu(entries, ctx),
      ...buildDisplaySubmenu(entries, ctx),
      ...buildTagSubmenu(entries, ctx),
    ];

    // ── タイムライン固有: 時刻トグル ──
    if (entry.panel === 'timeline') {
      const hasTime = entry.eventTime != null;
      result.push({
        label: hasTime ? '時刻を不明にする' : '時刻を設定',
        onClick: () => {
          if (hasTime) {
            ctx.updateEntry(entry.id, { eventTime: undefined, eventTimeSortKey: undefined });
          } else {
            ctx.updateEntry(entry.id, {});
            const { setFocusedEntry } = useStore.getState();
            setFocusedEntry(entry.id);
          }
        },
      });
    }

    result.push({ separator: true as const });
    result.push(...buildDuplicateItems(entries, ctx));
    result.push(...buildDeleteItems(entries, ctx));

    return result;
  }, [entry, ctx]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
