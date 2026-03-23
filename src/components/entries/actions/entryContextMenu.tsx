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
} from '@/components/entries/actions/menuItems';
import { useMenuContext } from '@/hooks/useMenuContext';

interface EntryContextMenuProps {
  entry: MemoEntry;
  x: number;
  y: number;
  onClose: () => void;
  onLinkRequest?: () => void;
}

export function EntryContextMenu({ entry, x, y, onClose, onLinkRequest }: EntryContextMenuProps) {
  const ctx = useMenuContext();

  const items = useMemo<ContextMenuEntry[]>(() => {
    const entries = [entry];

    const result: ContextMenuEntry[] = [
      ...buildMoveSubmenu(entries, ctx),
      ...buildImportanceSubmenu(entries, ctx),
      ...buildDisplaySubmenu(entries, ctx),
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
    if (onLinkRequest) {
      const linkCount = entry.linkedEntryIds?.length ?? 0;
      result.push({
        label: linkCount > 0 ? `リンク設定（${linkCount}件）` : 'リンク設定',
        onClick: () => { onLinkRequest(); },
      });
    }
    result.push(...buildDuplicateItems(entries, ctx));
    result.push(...buildDeleteItems(entries, ctx));

    return result;
  }, [entry, ctx, onLinkRequest]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
