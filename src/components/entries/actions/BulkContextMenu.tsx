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

  const commonPanel = entries.every((e) => e.panel === entries[0].panel) ? entries[0].panel : null;

  const items = useMemo<ContextMenuEntry[]>(() => {
    const result: ContextMenuEntry[] = [];
    const count = entries.length;

    // ── カテゴリ移動 ──
    result.push({ header: true as const, label: `カテゴリ移動 (${count}件)` });

    for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
      if (commonPanel && p === commonPanel) continue;

      if (p === 'timeline') {
        if (timelineGroups.length === 0) {
          result.push({ label: `${PANEL_LABELS[p]} へ`, disabled: true, onClick: () => {} });
        } else if (timelineGroups.length === 1) {
          result.push({
            label: `${PANEL_LABELS[p]} へ`,
            onClick: async () => {
              for (const entry of entries) {
                if (entry.panel === p) continue;
                await moveEntryToPanel(entry.id, p);
                await updateEntry(entry.id, { timelineGroupId: timelineGroups[0].id, type: 'timeline' });
              }
              onDone();
            },
          });
        } else {
          result.push({
            label: `${PANEL_LABELS[p]} へ`,
            submenu: timelineGroups.map((g) => ({
              label: g.label,
              onClick: async () => {
                for (const entry of entries) {
                  if (entry.panel === p) continue;
                  await moveEntryToPanel(entry.id, p);
                  await updateEntry(entry.id, { timelineGroupId: g.id, type: 'timeline' });
                }
                onDone();
              },
            })),
          });
        }
      } else {
        const panelGroups = memoGroups.filter((g) => g.panel === p);
        result.push({
          label: `${PANEL_LABELS[p]} へ`,
          submenu: [
            {
              label: '未分類',
              onClick: async () => {
                for (const entry of entries) {
                  if (entry.panel === p) continue;
                  await moveEntryToPanel(entry.id, p);
                  await updateEntry(entry.id, { groupId: undefined });
                }
                onDone();
              },
            },
            ...panelGroups.map((g) => ({
              label: g.label,
              onClick: async () => {
                for (const entry of entries) {
                  if (entry.panel === p) continue;
                  await moveEntryToPanel(entry.id, p);
                  await updateEntry(entry.id, { groupId: g.id });
                }
                onDone();
              },
            })),
          ],
        });
      }
    }

    // ── グループ移動（同一パネルの場合のみ） ──
    const hasGroupSection = (() => {
      if (commonPanel === 'free' || commonPanel === 'personal') {
        return memoGroups.filter((g) => g.panel === commonPanel).length > 0;
      }
      if (commonPanel === 'timeline') return timelineGroups.length > 1;
      return false;
    })();

    if (hasGroupSection) {
      result.push({ separator: true as const });
      result.push({ header: true as const, label: `グループ移動 (${count}件)` });

      if (commonPanel === 'free' || commonPanel === 'personal') {
        const panelGroups = memoGroups.filter((g) => g.panel === commonPanel);
        result.push({
          label: '未分類 へ',
          onClick: async () => {
            for (const entry of entries) {
              if (entry.groupId) await updateEntry(entry.id, { groupId: undefined });
            }
            onDone();
          },
        });
        for (const g of panelGroups) {
          result.push({
            label: `「${g.label}」へ`,
            onClick: async () => {
              for (const entry of entries) {
                if (entry.groupId !== g.id) await updateEntry(entry.id, { groupId: g.id });
              }
              onDone();
            },
          });
        }
      }

      if (commonPanel === 'timeline') {
        for (const g of timelineGroups) {
          result.push({
            label: `「${g.label}」へ`,
            onClick: async () => {
              for (const entry of entries) {
                if (entry.timelineGroupId !== g.id) await updateEntry(entry.id, { timelineGroupId: g.id });
              }
              onDone();
            },
          });
        }
      }
    }

    // ── 重要度設定 ──
    const hasNonImage = entries.some((e) => e.type !== 'image');
    if (hasNonImage) {
      result.push({ separator: true as const });
      result.push({ header: true as const, label: `重要度設定 (${count}件)` });
      for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
        result.push({
          label: `${label} に設定`,
          onClick: async () => {
            for (const entry of entries) {
              if (entry.type !== 'image') await updateEntry(entry.id, { importance: key as MemoEntry['importance'] });
            }
            onDone();
          },
        });
      }
      result.push({
        label: '設定をはずす',
        onClick: async () => {
          for (const entry of entries) {
            if (entry.importance) await updateEntry(entry.id, { importance: undefined });
          }
          onDone();
        },
      });
    }

    // ── 削除 ──
    result.push(
      { separator: true as const },
      {
        label: `削除 (${count}件)`,
        danger: true,
        onClick: async () => {
          for (const entry of entries) await deleteEntry(entry.id);
          onDone();
        },
      },
    );

    return result;
  }, [entries, commonPanel, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups, onDone]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
