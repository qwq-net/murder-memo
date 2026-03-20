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
  const updateEntry = useStore((s) => s.updateEntry);
  const reclassifyEntry = useStore((s) => s.reclassifyEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);

  const items = useMemo<ContextMenuEntry[]>(() => {
    const moveItems: ContextMenuEntry[] = (['free', 'personal', 'timeline'] as PanelId[])
      .filter((p) => p !== entry.panel)
      .map((p) => ({
        label: `${PANEL_LABELS[p]}へ移動`,
        disabled: p === 'timeline' && timelineGroups.length === 0,
        onClick: async () => {
          if (p === 'timeline' && timelineGroups.length > 0) {
            // タイムラインへ移動時は最初のグループに所属させる
            await moveEntryToPanel(entry.id, p);
            await updateEntry(entry.id, {
              timelineGroupId: timelineGroups[0].id,
              type: 'timeline',
            });
          } else {
            await moveEntryToPanel(entry.id, p);
          }
        },
      }));

    const typeItems: ContextMenuEntry[] = (['text', 'timeline', 'character-info', 'clue'] as MemoEntryType[])
      .filter((t) => t !== entry.type && entry.type !== 'image')
      .map((t) => ({
        label: `${TYPE_LABELS[t]}に変更`,
        onClick: () => reclassifyEntry(entry.id, t),
      }));

    // タイムラインエントリの場合: 未明 / 時刻あり トグル
    const timeToggleItems: ContextMenuEntry[] = [];
    if (entry.panel === 'timeline') {
      const hasTime = entry.eventTime != null;
      timeToggleItems.push(
        { separator: true as const },
        {
          label: hasTime ? '未明にする' : '時刻を設定',
          onClick: () => {
            if (hasTime) {
              updateEntry(entry.id, {
                eventTime: undefined,
                eventTimeSortKey: undefined,
              });
            } else {
              // 時刻設定 → 編集モードに入る
              updateEntry(entry.id, {});
              // フォーカスして編集モードへ
              const { setFocusedEntry } = useStore.getState();
              setFocusedEntry(entry.id);
            }
          },
        },
      );
    }

    return [
      ...moveItems,
      { separator: true as const },
      ...typeItems,
      ...timeToggleItems,
      { separator: true as const },
      {
        label: '削除',
        onClick: () => deleteEntry(entry.id),
        danger: true,
      },
    ];
  }, [entry, moveEntryToPanel, updateEntry, reclassifyEntry, deleteEntry, timelineGroups]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
