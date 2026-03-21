import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { memo, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MemoEntry } from '../../types/memo';
import { EntryCard } from './EntryCard';
import { useSelection } from './selection-context';

interface SortableEntryListProps {
  entries: MemoEntry[];
  onReorder: (orderedIds: string[]) => void;
  /** 連続する同時刻エントリの時刻ラベルを省略する（タイムラインの時間帯グループ用） */
  hideTimeDuplicates?: boolean;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0' } },
  }),
};

export function SortableEntryList({ entries, onReorder, hideTimeDuplicates }: SortableEntryListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeEntry = activeId ? entries.find((e) => e.id === activeId) ?? null : null;
  const { clearSelection } = useSelection();

  const allIds = useMemo(() => entries.map((e) => e.id), [entries]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    clearSelection();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(entries, oldIndex, newIndex).map((e) => e.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        {entries.map((entry, i) => (
          <SortableEntryCard
            key={entry.id}
            entry={entry}
            allIds={allIds}
            hideTime={hideTimeDuplicates && i > 0 && entry.eventTime === entries[i - 1].eventTime}
          />
        ))}
      </SortableContext>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeEntry && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                opacity: 0.95,
              }}
            >
              <EntryCard entry={activeEntry} />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

const SortableEntryCard = memo(function SortableEntryCard({ entry, allIds, hideTime }: { entry: MemoEntry; allIds: string[]; hideTime?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
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
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
        borderRadius: 'var(--radius-sm)',
        background: selected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
      }}
    >
      <EntryCard entry={entry} hideTime={hideTime} />
    </div>
  );
});
