import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { entryDropAnimation, useEntriesDndSensors } from '@/components/entries/dnd/dndConstants';
import { EntryCard } from '@/components/entries/entryCard';
import { useSelection } from '@/components/entries/selectionContext';
import { planEntryMove } from '@/lib/entryDnd';
import { useStore } from '@/store';

/**
 * 子ツリーが既にエントリ DnD コンテキスト配下にあるかを示すフラグ。
 * デスクトップでは AppShell が全パネルを 1 つの EntriesDndContext で包むため、各パネルは
 * これを見て「自前で DndContext を張らず列だけ描画する」ことを判断する（二重コンテキスト回避）。
 */
const EntriesDndPresence = createContext(false);

// eslint-disable-next-line react-refresh/only-export-components
export function useInEntriesDnd(): boolean {
  return useContext(EntriesDndPresence);
}

/**
 * エントリのコンテナ跨ぎ DnD を司る DndContext。
 *
 * 配下の {@link SortableEntryColumn} 群を 1 つの DndContext で束ね、メモグループ間・時間帯間・
 * TLグループ間・（デスクトップでは）パネル間の移動を成立させる。ドロップ確定は planEntryMove
 * （純関数）で組み立て、store の moveEntryAcrossContainers に委譲する。
 *
 * フィルタ中のパネルは「表示が部分集合」になり並び替えで sortOrder が壊れるため、移動元・移動先の
 * いずれかがフィルタ中なら確定しない（列側も disabled でドラッグ開始自体を抑止する）。
 */
export function EntriesDndContext({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { clearSelection } = useSelection();
  const sensors = useEntriesDndSensors();
  const moveEntryAcrossContainers = useStore((s) => s.moveEntryAcrossContainers);

  // DragOverlay 用の active エントリは購読せず getState から取得（再描画を増やさない）。
  // activeId が変わったときだけ O(n) find を走らせる
  const activeEntry = useMemo(
    () => (activeId ? (useStore.getState().entries.find((e) => e.id === activeId) ?? null) : null),
    [activeId],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    clearSelection();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const state = useStore.getState();
    const activeEntry = state.entries.find((e) => e.id === active.id);
    if (!activeEntry) return;

    const move = planEntryMove({
      activeId: active.id as string,
      overId: over.id as string,
      entries: state.entries,
      timelineGroups: state.timelineGroups,
    });
    if (!move) return;

    // フィルタ中（移動元 or 移動先パネル）は確定しない（部分集合での sortOrder 破壊を防ぐ）。
    // キャラクター・重要度いずれのフィルタも対象に含める。
    if (
      state.characterFilter[activeEntry.panel].length > 0 ||
      state.characterFilter[move.panel].length > 0 ||
      state.importanceFilter[activeEntry.panel].length > 0 ||
      state.importanceFilter[move.panel].length > 0
    ) {
      return;
    }

    void moveEntryAcrossContainers(move);
  };

  return (
    <EntriesDndPresence.Provider value={true}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {children}

        {createPortal(
          <DragOverlay dropAnimation={entryDropAnimation}>
            {activeEntry && (
              <div
                className="bg-bg-elevated rounded-sm opacity-95"
                style={{ boxShadow: '0 4px 16px var(--shadow-drag)' }}
              >
                <EntryCard entry={activeEntry} />
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </EntriesDndPresence.Provider>
  );
}

/**
 * パネルが自前で DnD コンテキストを張るかを切り替える境界。
 * 既に上位（デスクトップの AppShell 全体コンテキスト）配下なら素通しし、そうでなければ
 * （モバイルの単一パネル表示など）パネル単位で EntriesDndContext を張る。
 */
export function PanelDndBoundary({ children }: { children: React.ReactNode }) {
  const inside = useInEntriesDnd();
  if (inside) return <>{children}</>;
  return <EntriesDndContext>{children}</EntriesDndContext>;
}
