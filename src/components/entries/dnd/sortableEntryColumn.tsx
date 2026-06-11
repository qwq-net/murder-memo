import { useDndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';

import { SortableEntryCard } from '@/components/entries/dnd/sortableEntryCard';
import type { MemoEntry } from '@/types/memo';

interface SortableEntryColumnProps {
  /** ドロップ先を一意に識別するコンテナ id（lib/entryDnd の命名規約に従う） */
  containerId: string;
  entries: MemoEntry[];
  /** 連続する同時刻エントリの時刻ラベルを省略する（タイムラインの時間帯グループ用） */
  hideTimeDuplicates?: boolean;
  /**
   * 並び替え・ドロップを無効化する（キャラクターフィルター適用中など）。
   * 部分集合の id で並び替えると非表示エントリと sortOrder が衝突するため。
   */
  disabled?: boolean;
  /** エントリが空のとき列内に表示するプレースホルダ（空グループでもドロップ可能にする） */
  emptyPlaceholder?: React.ReactNode;
}

/**
 * 単一の「コンテナ」（メモグループ / タイムラインの時間帯・不明）を表す並び替え可能な列。
 *
 * 上位の {@link EntriesDndContext} が張る DndContext を共有し、コンテナ自身を useDroppable で
 * ドロップ可能にする（空コンテナにも落とせる）。DndContext / DragOverlay / sensors は持たない。
 */
export function SortableEntryColumn({
  containerId,
  entries,
  hideTimeDuplicates,
  disabled = false,
  emptyPlaceholder,
}: SortableEntryColumnProps) {
  const allIds = useMemo(() => entries.map((e) => e.id), [entries]);
  const { setNodeRef } = useDroppable({ id: containerId, disabled });
  const { active, over } = useDndContext();

  // コンテナ跨ぎ DnD の視覚フィードバック。隣接並び替えと違い跨ぎは要素が動かず落とし先が
  // 見えないため、ドラッグ中はカーソル直下のコンテナをアクセント色の薄い塗りつぶしで示す
  // （操作後の状態を予測しやすくする）。useSortable が data に持つ sortable.containerId
  // （= SortableContext の id）から、ドラッグ元・ホバー先のコンテナを判定する。
  const activeContainerId = active?.data.current?.sortable?.containerId as string | undefined;
  const overContainerId =
    (over?.data.current?.sortable?.containerId as string | undefined) ??
    (typeof over?.id === 'string' ? over.id : undefined);
  // ドラッグ元と異なるコンテナにカーソルがあるときだけ塗る（同一コンテナは通常の並び替え演出）
  const isOverTarget =
    !disabled &&
    active != null &&
    activeContainerId !== containerId &&
    overContainerId === containerId;

  return (
    <SortableContext id={containerId} items={allIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className="rounded-sm transition-colors duration-150"
        style={
          isOverTarget
            ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }
            : undefined
        }
      >
        {entries.map((entry, i) => (
          <SortableEntryCard
            key={entry.id}
            entry={entry}
            allIds={allIds}
            disabled={disabled}
            hideTime={hideTimeDuplicates && i > 0 && entry.eventTime === entries[i - 1].eventTime}
          />
        ))}
        {entries.length === 0 && emptyPlaceholder}
      </div>
    </SortableContext>
  );
}
