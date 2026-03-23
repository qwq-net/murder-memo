import { useMemo } from 'react';

import { useGroupSwap } from '@/hooks/useGroupSwap';
import { groupEntriesByTimeline } from '@/lib/grouping';
import { useStore } from '@/store';
import { EmptyState } from '@/components/common/emptyState';
import { EntryInput } from '@/components/entries/entryInput';
import { TimelineGroupSection } from '@/components/panels/timelineGroupSection';

export function TimelinePanel() {
  const allEntries = useStore((s) => s.entries);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const toggleTimelineGroupCollapse = useStore((s) => s.toggleTimelineGroupCollapse);
  const removeTimelineGroup = useStore((s) => s.removeTimelineGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const addToast = useStore((s) => s.addToast);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const reorderTimelineGroups = useStore((s) => s.reorderTimelineGroups);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const filterIds = useStore((s) => s.characterFilter.timeline);

  const swapGroup = useGroupSwap(timelineGroups, reorderTimelineGroups);

  const timelineEntries = useMemo(() => {
    let result = allEntries.filter((e) => e.panel === 'timeline');
    if (filterIds.length > 0) {
      result = result.filter((e) => e.characterTags.some((t) => filterIds.includes(t)));
    }
    return result;
  }, [allEntries, filterIds]);

  const groupedData = useMemo(
    () => groupEntriesByTimeline(timelineEntries, timelineGroups),
    [timelineEntries, timelineGroups],
  );

  const isEmpty = timelineGroups.length === 0;
  const isFiltering = filterIds.length > 0;
  const isFilteredEmpty = isFiltering && timelineEntries.length === 0 && !isEmpty;

  const entryInput = <EntryInput panel="timeline" />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[60px]">
        {isFilteredEmpty ? (
          <div className="py-6 px-5 text-center text-sm text-text-faint">
            フィルター条件に一致するメモはありません
          </div>
        ) : isEmpty ? (
          <EmptyState
            accentColor="var(--panel-timeline-accent)"
            message="メモグループを追加してタイムラインを整理しよう"
            onAddGroup={async (label) => { await addTimelineGroup(label); addToast('グループを追加しました'); }}
          />
        ) : (
          groupedData.map(({ group, hourGroups, unknown }, i) => (
            <TimelineGroupSection
              key={group.id}
              group={group}
              hourGroups={hourGroups}
              unknownEntries={unknown}
              onToggleCollapse={toggleTimelineGroupCollapse}
              onRemove={removeTimelineGroup}
              onUpdate={updateTimelineGroup}
              onReorderEntries={(ids) => reorderEntries('timeline', ids)}
              onMoveUp={i > 0 ? () => swapGroup(i, -1) : undefined}
              onMoveDown={i < timelineGroups.length - 1 ? () => swapGroup(i, 1) : undefined}
            />
          ))
        )}

      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
