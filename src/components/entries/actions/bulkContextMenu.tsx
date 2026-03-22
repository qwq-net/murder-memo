import { useMemo } from 'react';

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
import { useMenuContext } from '@/hooks/useMenuContext';

interface BulkContextMenuProps {
  entries: MemoEntry[];
  x: number;
  y: number;
  onClose: () => void;
  onDone: () => void;
}

export function BulkContextMenu({ entries, x, y, onClose, onDone }: BulkContextMenuProps) {
  const ctx = useMenuContext(onDone);

  const items = useMemo<ContextMenuEntry[]>(() => {
    return [
      ...buildCategoryMoveItems(entries, ctx),
      ...buildGroupMoveItems(entries, ctx),
      ...buildImportanceItems(entries, ctx),
      ...buildDisplayItems(entries, ctx),
      ...buildDeleteItems(entries, ctx),
    ];
  }, [entries, ctx]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
