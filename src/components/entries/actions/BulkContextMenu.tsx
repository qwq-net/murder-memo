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

  // 全エントリが同一パネルかを判定
  const commonPanel = entries.every((e) => e.panel === entries[0].panel) ? entries[0].panel : null;

  const items = useMemo<ContextMenuEntry[]>(() => {
    const result: ContextMenuEntry[] = [];
    const count = entries.length;

    // ── パネル一括移動 ──
    for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
      // 全て同一パネルなら自パネルを除外。混在なら全表示
      if (commonPanel && p === commonPanel) continue;
      result.push({
        label: `${PANEL_LABELS[p]}へ移動 (${count}件)`,
        color: PANEL_COLORS[p],
        disabled: p === 'timeline' && timelineGroups.length === 0,
        onClick: async () => {
          for (const entry of entries) {
            if (entry.panel === p) continue;
            if (p === 'timeline' && timelineGroups.length > 0) {
              await moveEntryToPanel(entry.id, p);
              await updateEntry(entry.id, {
                timelineGroupId: timelineGroups[0].id,
                type: 'timeline',
              });
            } else {
              await moveEntryToPanel(entry.id, p);
            }
          }
          onDone();
        },
      });
    }

    // ── グループ一括移動（同一パネルの場合のみ） ──
    if (commonPanel === 'free' || commonPanel === 'personal') {
      const panelGroups = memoGroups.filter((g) => g.panel === commonPanel);
      if (panelGroups.length > 0) {
        result.push({ separator: true as const });
        result.push({
          label: `未分類へ移動 (${count}件)`,
          onClick: async () => {
            for (const entry of entries) {
              if (entry.groupId) await updateEntry(entry.id, { groupId: undefined });
            }
            onDone();
          },
        });
        for (const g of panelGroups) {
          result.push({
            label: `「${g.label}」へ移動 (${count}件)`,
            onClick: async () => {
              for (const entry of entries) {
                if (entry.groupId !== g.id) await updateEntry(entry.id, { groupId: g.id });
              }
              onDone();
            },
          });
        }
      }
    }

    if (commonPanel === 'timeline' && timelineGroups.length > 1) {
      result.push({ separator: true as const });
      for (const g of timelineGroups) {
        result.push({
          label: `「${g.label}」へ移動 (${count}件)`,
          onClick: async () => {
            for (const entry of entries) {
              if (entry.timelineGroupId !== g.id) {
                await updateEntry(entry.id, { timelineGroupId: g.id });
              }
            }
            onDone();
          },
        });
      }
    }

    // ── 重要度一括設定 ──
    const hasNonImage = entries.some((e) => e.type !== 'image');
    if (hasNonImage) {
      result.push({ separator: true as const });
      for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
        result.push({
          label: `重要度: ${label} (${count}件)`,
          onClick: async () => {
            for (const entry of entries) {
              if (entry.type !== 'image') {
                await updateEntry(entry.id, { importance: key as MemoEntry['importance'] });
              }
            }
            onDone();
          },
        });
      }
      result.push({
        label: `重要度をクリア (${count}件)`,
        onClick: async () => {
          for (const entry of entries) {
            if (entry.importance) await updateEntry(entry.id, { importance: undefined });
          }
          onDone();
        },
      });
    }

    // ── 一括削除 ──
    result.push(
      { separator: true as const },
      {
        label: `削除 (${count}件)`,
        danger: true,
        onClick: async () => {
          for (const entry of entries) {
            await deleteEntry(entry.id);
          }
          onDone();
        },
      },
    );

    return result;
  }, [entries, commonPanel, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups, onDone]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
