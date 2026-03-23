import { useMemo } from 'react';

import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { useGroupSwap } from '@/hooks/useGroupSwap';
import { groupEntriesByTimeline } from '@/lib/grouping';
import { useStore } from '@/store';
import type { MemoEntry, TimelineGroup } from '@/types/memo';
import { EmptyState } from '@/components/common/emptyState';
import { GroupHeader } from '@/components/common/groupHeader';
import { EntryInput } from '@/components/entries/entryInput';
import { SortableEntryList } from '@/components/entries/sortableEntryList';

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

// ─── グループセクション ──────────────────────────────────────────────────────

interface TimelineGroupSectionProps {
  group: TimelineGroup;
  hourGroups: { hour: number; label: string; entries: MemoEntry[] }[];
  unknownEntries: MemoEntry[];
  onToggleCollapse: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Pick<TimelineGroup, 'label' | 'collapsed'>>) => Promise<void>;
  onReorderEntries: (orderedIds: string[]) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function TimelineGroupSection({
  group,
  hourGroups,
  unknownEntries,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onReorderEntries,
  onMoveUp,
  onMoveDown,
}: TimelineGroupSectionProps) {
  const entryCount = hourGroups.reduce((sum, hg) => sum + hg.entries.length, 0) + unknownEntries.length;

  const labelEditor = useGroupLabelEditor({
    initialLabel: group.label,
    onSave: (newLabel) => onUpdate(group.id, { label: newLabel }),
    toastMessage: 'グループ名を変更しました',
  });

  const deleteConfirm = useDeleteWithConfirmation(
    entryCount > 0,
    () => onRemove(group.id),
    'グループを削除しました',
  );

  return (
    <div>
      <GroupHeader
        label={group.label}
        collapsed={group.collapsed}
        accentColor="var(--panel-timeline-accent)"
        onToggle={() => onToggleCollapse(group.id)}
        labelEditor={labelEditor}
        deleteConfirm={deleteConfirm}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        deleteModal={{
          title: `「${group.label}」を削除`,
          confirmationLabel: `メモが ${entryCount}件 一緒に削除されることを理解しました`,
        }}
      />

      {/* グループ内容 */}
      {!group.collapsed && (
        // --tl-spine-x: 縦線・ドットの中心X座標の単一の真実の情報源
        // 縦線・HourDividerドットはともにこの値から位置を計算するため、値を変えれば両方追従する
        <div className="relative py-2.5" style={{ '--tl-spine-x': '14px' } as React.CSSProperties}>
          {/* 縦線 — width:1px + translateX(-50%) で中心を --tl-spine-x に合わせる */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: 'var(--tl-spine-x)', width: 1, transform: 'translateX(-50%)' }}
          >
            {/* 上部破線 */}
            <div
              className="absolute top-0 h-2.5 w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent) 0 2px, transparent 2px 4px)',
              }}
            />
            {/* 中央実線 */}
            <div
              className="absolute top-2.5 bottom-2.5 w-full"
              style={{
                background: 'color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)',
              }}
            />
            {/* 下部破線 */}
            <div
              className="absolute bottom-0 h-2.5 w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent) 0 2px, transparent 2px 4px)',
              }}
            />
          </div>

          <div className="pl-1.5">
            {/* 時間帯グループ — 同一時間帯内でDnDソート可能 */}
            {hourGroups.map((hg) => (
              <div key={hg.hour}>
                <HourDivider label={hg.label} />
                <SortableEntryList
                  entries={hg.entries}
                  onReorder={onReorderEntries}
                  hideTimeDuplicates
                />
              </div>
            ))}

            {/* 不明グループ — DnDで並び替え可能 */}
            {unknownEntries.length > 0 && (
              <div>
                <HourDivider label="不明" />
                <SortableEntryList
                  entries={unknownEntries}
                  onReorder={onReorderEntries}
                />
              </div>
            )}

            {/* 空の場合 */}
            {hourGroups.length === 0 && unknownEntries.length === 0 && (
              <div className="px-3 py-3.5 text-sm text-text-faint text-center">
                メモを追加してください
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 時間帯の区切りライン ―――― 9:00 ―――――――― */
function HourDivider({ label, muted }: { label: string; muted?: boolean }) {
  const lineColor = muted
    ? 'color-mix(in srgb, var(--border-subtle) 40%, transparent)'
    : 'color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)';

  return (
    <div className="flex items-center gap-2 pt-0.5 pr-2 pb-0 pl-0">
      {/* 左ライン — 縦線とクロスする */}
      <span className="flex-1 h-px" style={{ background: lineColor }} />
      <span
        className={`text-sm font-mono tracking-[0.06em] shrink-0 ${
          muted ? 'text-text-faint' : 'text-text-muted'
        }`}
      >
        {label}
      </span>
      {/* 右ライン */}
      <span className="flex-1 h-px" style={{ background: lineColor }} />
    </div>
  );
}
