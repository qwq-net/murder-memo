import { useMemo } from 'react';

import { useStore } from '../../../store';
import type { MemoEntry, MemoEntryType, PanelId } from '../../../types/memo';
import type { ContextMenuEntry } from '../../common/ContextMenu';
import { ContextMenu } from '../../common/ContextMenu';

const PANEL_LABELS: Record<PanelId, string> = {
  free: '自由メモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

const TYPE_LABELS: Record<MemoEntryType, string> = {
  text: 'テキスト',
  timeline: '時系列',
  'character-info': '人物情報',
  clue: '手がかり',
  image: '画像',
};

interface EntryContextMenuProps {
  entry: MemoEntry;
  x: number;
  y: number;
  onClose: () => void;
}

export function EntryContextMenu({ entry, x, y, onClose }: EntryContextMenuProps) {
  const moveEntryToPanel = useStore((s) => s.moveEntryToPanel);
  const reclassifyEntry = useStore((s) => s.reclassifyEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const items = useMemo<ContextMenuEntry[]>(() => {
    const moveItems: ContextMenuEntry[] = (['free', 'personal', 'timeline'] as PanelId[])
      .filter((p) => p !== entry.panel)
      .map((p) => ({
        label: `${PANEL_LABELS[p]}へ移動`,
        onClick: () => moveEntryToPanel(entry.id, p),
      }));

    const typeItems: ContextMenuEntry[] = (['text', 'timeline', 'character-info', 'clue'] as MemoEntryType[])
      .filter((t) => t !== entry.type && entry.type !== 'image')
      .map((t) => ({
        label: `${TYPE_LABELS[t]}に変更`,
        onClick: () => reclassifyEntry(entry.id, t),
      }));

    return [
      ...moveItems,
      { separator: true as const },
      ...typeItems,
      { separator: true as const },
      {
        label: '削除',
        onClick: () => deleteEntry(entry.id),
        danger: true,
      },
    ];
  }, [entry, moveEntryToPanel, reclassifyEntry, deleteEntry]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
