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
import { useState } from 'react';
import { createPortal } from 'react-dom';

import type { MemoEntry } from '../../types/memo';
import { EntryCard } from './EntryCard';

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {entries.map((entry, i) => (
          <SortableEntryCard
            key={entry.id}
            entry={entry}
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

function SortableEntryCard({ entry, hideTime }: { entry: MemoEntry; hideTime?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        // ドラッグ中のアイテムはtransitionを無効化（DragOverlayが視覚的役割を担う）
        // 他のアイテムにはtransitionを適用してスムーズにシフトさせる
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
      }}
    >
      <EntryCard entry={entry} hideTime={hideTime} />
    </div>
  );
}
