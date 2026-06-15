import { useMemo } from 'react';

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
import { useT } from '@/i18n';
import { useMenuContext } from '@/hooks/useMenuContext';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

interface EntryContextMenuProps {
  entry: MemoEntry;
  x: number;
  y: number;
  onClose: () => void;
}

export function EntryContextMenu({ entry, x, y, onClose }: EntryContextMenuProps) {
  const ctx = useMenuContext();
  const t = useT();

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
        label: hasTime ? t('menus.clearTime') : t('menus.setTime'),
        onClick: () => {
          if (hasTime) {
            ctx.updateEntry(entry.id, { eventTime: undefined, eventTimeSortKey: undefined });
          } else {
            // 編集状態にしつつ、本文ではなく時刻入力へフォーカスするよう要求する
            useStore.getState().requestTimeEdit(entry.id);
          }
        },
      });
    }

    result.push({ separator: true as const });
    result.push(...buildDuplicateItems(entries, ctx));
    result.push(...buildDeleteItems(entries, ctx));

    return result;
  }, [entry, ctx, t]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
