import { useMemo } from 'react';

import { useStore } from '../../../store';
import type { MemoEntry, PanelId } from '../../../types/memo';
import type { ContextMenuEntry } from '../../common/ContextMenu';
import { ContextMenu } from '../../common/ContextMenu';

const PANEL_LABELS: Record<PanelId, string> = {
  free: '自由メモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

const PANEL_COLORS: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

const IMPORTANCE_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const IMPORTANCE_COLORS: Record<string, string> = {
  high: 'var(--importance-high)',
  medium: 'var(--importance-medium)',
  low: 'var(--importance-low)',
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
  const deleteEntry = useStore((s) => s.deleteEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);

  const items = useMemo<ContextMenuEntry[]>(() => {
    const result: ContextMenuEntry[] = [];

    // ── パネル移動 ──
    for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
      if (p === entry.panel) continue;
      result.push({
        label: `${PANEL_LABELS[p]}へ移動`,
        color: PANEL_COLORS[p],
        disabled: p === 'timeline' && timelineGroups.length === 0,
        onClick: async () => {
          if (p === 'timeline' && timelineGroups.length > 0) {
            await moveEntryToPanel(entry.id, p);
            await updateEntry(entry.id, {
              timelineGroupId: timelineGroups[0].id,
              type: 'timeline',
            });
          } else {
            await moveEntryToPanel(entry.id, p);
          }
        },
      });
    }

    // ── グループ移動（同一パネル内） ──
    if (entry.panel === 'free' || entry.panel === 'personal') {
      const panelGroups = memoGroups.filter((g) => g.panel === entry.panel);
      if (panelGroups.length > 0) {
        result.push({ separator: true as const });
        // 未分類へ移動（既にグループ所属の場合）
        if (entry.groupId) {
          result.push({
            label: '未分類へ移動',
            onClick: () => updateEntry(entry.id, { groupId: undefined }),
          });
        }
        // 各グループへ移動
        for (const g of panelGroups) {
          if (g.id === entry.groupId) continue;
          result.push({
            label: `「${g.label}」へ移動`,
            onClick: () => updateEntry(entry.id, { groupId: g.id }),
          });
        }
      }
    }

    if (entry.panel === 'timeline') {
      if (timelineGroups.length > 1) {
        result.push({ separator: true as const });
        for (const g of timelineGroups) {
          if (g.id === entry.timelineGroupId) continue;
          result.push({
            label: `「${g.label}」へ移動`,
            onClick: () => updateEntry(entry.id, { timelineGroupId: g.id }),
          });
        }
      }
    }

    // ── 重要度 ──
    if (entry.type !== 'image') {
      result.push({ separator: true as const });
      for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
        const isCurrent = entry.importance === key;
        result.push({
          label: isCurrent ? `★ 重要度: ${label}` : `重要度: ${label}`,
          color: isCurrent ? IMPORTANCE_COLORS[key] : undefined,
          onClick: () => updateEntry(entry.id, {
            importance: isCurrent ? undefined : key as MemoEntry['importance'],
          }),
        });
      }
    }

    // ── タイムライン固有: 時刻トグル ──
    if (entry.panel === 'timeline') {
      const hasTime = entry.eventTime != null;
      result.push(
        { separator: true as const },
        {
          label: hasTime ? '不明にする' : '時刻を設定',
          onClick: () => {
            if (hasTime) {
              updateEntry(entry.id, {
                eventTime: undefined,
                eventTimeSortKey: undefined,
              });
            } else {
              updateEntry(entry.id, {});
              const { setFocusedEntry } = useStore.getState();
              setFocusedEntry(entry.id);
            }
          },
        },
      );
    }

    // ── 削除 ──
    result.push(
      { separator: true as const },
      {
        label: '削除',
        onClick: () => deleteEntry(entry.id),
        danger: true,
      },
    );

    return result;
  }, [entry, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
