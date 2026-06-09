import { useSortable } from '@dnd-kit/sortable';
import { memo } from 'react';

import { EntryCard } from '@/components/entries/entryCard';
import { useSelection } from '@/components/entries/selectionContext';
import type { MemoEntry } from '@/types/memo';

/**
 * 並び替え・コンテナ跨ぎ DnD 対応のエントリカード。
 * useSortable でドラッグ可能にし、Shift+クリックの複数選択ロジック（useSelection）も統合する。
 * transform は Y 軸のみ適用（縦リスト前提）。再描画コストを抑えるため memo 化。
 */
export const SortableEntryCard = memo(function SortableEntryCard({
  entry,
  allIds,
  hideTime,
  disabled,
}: {
  entry: MemoEntry;
  allIds: string[];
  hideTime?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled,
  });
  const { isSelected, handleSelect, hasSelection, clearSelection } = useSelection();
  const selected = isSelected(entry.id);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      onClick={(e) => {
        if (e.shiftKey) {
          // Shift+クリック: 選択操作。編集モードに入らないよう伝播停止
          e.preventDefault();
          e.stopPropagation();
          // ブラウザのテキスト選択をクリア
          window.getSelection()?.removeAllRanges();
          handleSelect(entry.id, true, allIds);
        } else if (hasSelection) {
          // Shift無しクリック + 選択中 → 選択解除
          clearSelection();
        }
      }}
      onMouseDown={(e) => {
        // Shift+mousedownでブラウザの範囲テキスト選択を抑止
        if (e.shiftKey) {
          e.preventDefault();
        }
      }}
      onMouseUp={(e) => {
        // Shift中はTextEntry/TimelineEntryのonMouseUpに届かないようにする
        if (e.shiftKey) {
          e.stopPropagation();
        }
      }}
      className="touch-none rounded-sm"
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0 : 1,
        background: selected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
      }}
    >
      <EntryCard entry={entry} hideTime={hideTime} />
    </div>
  );
});
