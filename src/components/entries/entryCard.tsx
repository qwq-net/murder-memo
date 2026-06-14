import { useCallback, useMemo, useState } from 'react';

import { BulkContextMenu } from '@/components/entries/actions/bulkContextMenu';
import { EntryContextMenu } from '@/components/entries/actions/entryContextMenu';
import { EntryCardView } from '@/components/entries/entryCardView';
import { ImageEntry } from '@/components/entries/imageEntry';
import { useSelection } from '@/components/entries/selectionContext';
import { TextEntry } from '@/components/entries/textEntry';
import { TimelineEntry } from '@/components/entries/timelineEntry';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

interface EntryCardProps {
  entry: MemoEntry;
  hideTime?: boolean;
}

/** bulkCtxMenu 非表示時の空配列（毎レンダーの新規生成を避けるためモジュール定数化） */
const NO_SELECTED_ENTRIES: MemoEntry[] = [];

/**
 * エントリ表示の店長ラッパー。
 *
 * - 装飾レイアウト（重要度グラデーション / 左縦線 / タイムラインマーカー / 重要度アイコン）は
 *   `EntryCardView` に委譲する純粋表示部分として切り出し済み
 * - ここでは selection / focus / hover / context menu などのインタラクション state と
 *   store 連携だけを担当する
 */
export function EntryCard({ entry, hideTime }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [bulkCtxMenu, setBulkCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  const { isSelected, selectedIds, clearSelection } = useSelection();
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const selected = isSelected(entry.id);
  const isEditing = focusedEntryId === entry.id;
  const isEntryHovered = (hovered && !ctxMenu && !bulkCtxMenu) || isEditing;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (selectedIds.size > 1 && selectedIds.has(entry.id)) {
        setBulkCtxMenu({ x: e.clientX, y: e.clientY });
      } else {
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }
    },
    [selectedIds, entry.id],
  );

  // bulkCtxMenu表示時のみentriesを取得（全EntryCardの不要な再レンダーを回避）。
  // メニュー表示中の毎レンダー filter を避けるため bulkCtxMenu / selectedIds でメモ化
  const selectedEntries = useMemo(
    () =>
      bulkCtxMenu
        ? useStore.getState().entries.filter((e) => selectedIds.has(e.id))
        : NO_SELECTED_ENTRIES,
    [bulkCtxMenu, selectedIds],
  );

  const renderContent = () => {
    // タイムラインは panel で判定（画像エントリも TimelineEntry で時刻を表示するため）
    if (entry.panel === 'timeline') {
      return <TimelineEntry entry={entry} hideTime={hideTime} isHovered={isEntryHovered} />;
    }
    if (entry.type === 'image' || entry.imageBlobKey) {
      return <ImageEntry entry={entry} isHovered={isEntryHovered} />;
    }
    return <TextEntry entry={entry} isHovered={isEntryHovered} />;
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <EntryCardView
        entry={entry}
        hideTime={hideTime}
        hovered={hovered || isEditing}
        selected={selected}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {renderContent()}
      </EntryCardView>

      {/* 単体コンテキストメニュー */}
      {ctxMenu && (
        <EntryContextMenu
          entry={entry}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* 一括コンテキストメニュー */}
      {bulkCtxMenu && (
        <BulkContextMenu
          entries={selectedEntries}
          x={bulkCtxMenu.x}
          y={bulkCtxMenu.y}
          onClose={() => setBulkCtxMenu(null)}
          onDone={() => {
            setBulkCtxMenu(null);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
