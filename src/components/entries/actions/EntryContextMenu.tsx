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

    // ── カテゴリ移動（全パネルにサブメニュー） ──
    result.push({ header: true as const, label: 'カテゴリ移動' });

    for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
      if (p === entry.panel) continue;

      if (p === 'timeline') {
        // タイムライン: グループ必須
        if (timelineGroups.length === 0) {
          result.push({ label: `${PANEL_LABELS[p]} へ`, disabled: true, onClick: () => {} });
        } else if (timelineGroups.length === 1) {
          result.push({
            label: `${PANEL_LABELS[p]} へ`,
            onClick: async () => {
              await moveEntryToPanel(entry.id, p);
              await updateEntry(entry.id, { timelineGroupId: timelineGroups[0].id, type: 'timeline' });
            },
          });
        } else {
          result.push({
            label: `${PANEL_LABELS[p]} へ`,
            submenu: timelineGroups.map((g) => ({
              label: g.label,
              onClick: async () => {
                await moveEntryToPanel(entry.id, p);
                await updateEntry(entry.id, { timelineGroupId: g.id, type: 'timeline' });
              },
            })),
          });
        }
      } else {
        // free / personal: 常にサブメニュー（未分類 + グループ）
        const panelGroups = memoGroups.filter((g) => g.panel === p);
        result.push({
          label: `${PANEL_LABELS[p]} へ`,
          submenu: [
            {
              label: '未分類',
              onClick: async () => {
                await moveEntryToPanel(entry.id, p);
                await updateEntry(entry.id, { groupId: undefined });
              },
            },
            ...panelGroups.map((g) => ({
              label: g.label,
              onClick: async () => {
                await moveEntryToPanel(entry.id, p);
                await updateEntry(entry.id, { groupId: g.id });
              },
            })),
          ],
        });
      }
    }

    // ── グループ移動（同一パネル内） ──
    const hasGroupSection = (() => {
      if (entry.panel === 'free' || entry.panel === 'personal') {
        return memoGroups.filter((g) => g.panel === entry.panel).length > 0;
      }
      if (entry.panel === 'timeline') return timelineGroups.length > 1;
      return false;
    })();

    if (hasGroupSection) {
      result.push({ separator: true as const });
      result.push({ header: true as const, label: 'グループ移動' });

      if (entry.panel === 'free' || entry.panel === 'personal') {
        const panelGroups = memoGroups.filter((g) => g.panel === entry.panel);
        if (entry.groupId) {
          result.push({
            label: '未分類 へ',
            onClick: () => updateEntry(entry.id, { groupId: undefined }),
          });
        }
        for (const g of panelGroups) {
          if (g.id === entry.groupId) continue;
          result.push({
            label: `「${g.label}」へ`,
            onClick: () => updateEntry(entry.id, { groupId: g.id }),
          });
        }
      }

      if (entry.panel === 'timeline') {
        for (const g of timelineGroups) {
          if (g.id === entry.timelineGroupId) continue;
          result.push({
            label: `「${g.label}」へ`,
            onClick: () => updateEntry(entry.id, { timelineGroupId: g.id }),
          });
        }
      }
    }

    // ── 重要度設定 ──
    if (entry.type !== 'image') {
      result.push({ separator: true as const });
      result.push({ header: true as const, label: '重要度設定' });
      for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
        if (entry.importance === key) continue;
        result.push({
          label: `${label} に設定`,
          onClick: () => updateEntry(entry.id, { importance: key as MemoEntry['importance'] }),
        });
      }
      if (entry.importance) {
        result.push({
          label: '設定をはずす',
          onClick: () => updateEntry(entry.id, { importance: undefined }),
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
              updateEntry(entry.id, { eventTime: undefined, eventTimeSortKey: undefined });
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
      { label: '削除', onClick: () => deleteEntry(entry.id), danger: true },
    );

    return result;
  }, [entry, moveEntryToPanel, updateEntry, deleteEntry, timelineGroups, memoGroups]);

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
