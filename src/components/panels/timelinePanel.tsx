import { useMemo } from 'react';

import { EmptyState } from '@/components/common/emptyState';
import { PanelDndBoundary } from '@/components/entries/dnd/entriesDndContext';
import { EntryInput } from '@/components/entries/entryInput';
import { TimelineGroupSection } from '@/components/panels/timelineGroupSection';
import { useGroupSwap } from '@/hooks/useGroupSwap';
import { filterEntries, isFilterActive, resolveCharacterNames } from '@/lib/entryFilter';
import { groupEntriesByTimeline } from '@/lib/grouping';
import { useStore } from '@/store';

export function TimelinePanel() {
  const allEntries = useStore((s) => s.entries);
  const allCharacters = useStore((s) => s.characters);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const toggleTimelineGroupCollapse = useStore((s) => s.toggleTimelineGroupCollapse);
  const removeTimelineGroup = useStore((s) => s.removeTimelineGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const addToast = useStore((s) => s.addToast);
  const reorderTimelineGroups = useStore((s) => s.reorderTimelineGroups);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const filterIds = useStore((s) => s.characterFilter.timeline);
  const importanceLevels = useStore((s) => s.importanceFilter.timeline);

  const swapGroup = useGroupSwap(timelineGroups, reorderTimelineGroups);

  // フィルター対象キャラクターの名前リスト（テキスト中の名前でも一致させるため）
  const filterCharNames = useMemo(
    () => resolveCharacterNames(allCharacters, filterIds),
    [allCharacters, filterIds],
  );

  const criteria = useMemo(
    () => ({ characterIds: filterIds, characterNames: filterCharNames, importanceLevels }),
    [filterIds, filterCharNames, importanceLevels],
  );

  const timelineEntries = useMemo(
    () =>
      filterEntries(
        allEntries.filter((e) => e.panel === 'timeline'),
        criteria,
      ),
    [allEntries, criteria],
  );

  const groupedData = useMemo(
    () => groupEntriesByTimeline(timelineEntries, timelineGroups),
    [timelineEntries, timelineGroups],
  );

  const isEmpty = timelineGroups.length === 0;
  const isFiltering = isFilterActive(criteria);
  const isFilteredEmpty = isFiltering && timelineEntries.length === 0 && !isEmpty;

  const entryInput = <EntryInput panel="timeline" />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-[60px]">
        {isFilteredEmpty ? (
          <div className="text-text-faint px-5 py-6 text-center text-sm">
            フィルター条件に一致するメモはありません
          </div>
        ) : isEmpty ? (
          <EmptyState
            accentColor="var(--panel-timeline-accent)"
            message="メモグループを追加してタイムラインを整理しよう"
            onAddGroup={async (label) => {
              await addTimelineGroup(label);
              addToast('グループを追加しました');
            }}
          />
        ) : (
          <PanelDndBoundary>
            {groupedData.map(({ group, hourGroups, unknown }, i) => (
              <TimelineGroupSection
                key={group.id}
                group={group}
                hourGroups={hourGroups}
                unknownEntries={unknown}
                onToggleCollapse={toggleTimelineGroupCollapse}
                onRemove={removeTimelineGroup}
                onUpdate={updateTimelineGroup}
                onMoveUp={i > 0 ? () => swapGroup(i, -1) : undefined}
                onMoveDown={i < timelineGroups.length - 1 ? () => swapGroup(i, 1) : undefined}
                dndDisabled={isFiltering}
              />
            ))}
          </PanelDndBoundary>
        )}
      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
