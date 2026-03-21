import { useMemo, useState } from 'react';

import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { useGroupSwap } from '@/hooks/useGroupSwap';
import { groupEntriesByTimeline } from '@/lib/grouping';
import { useStore } from '@/store';
import type { MemoEntry, TimelineGroup } from '@/types/memo';
import { ConfirmModal } from '@/components/common/confirmModal';
import { EmptyState } from '@/components/common/emptyState';
import { EntryInput } from '@/components/entries/entryInput';
import { SortableEntryList } from '@/components/entries/sortableEntryList';
import { ArrowDown, ArrowUp, ChevronDown, SquarePen, X } from '@/components/icons';

export function TimelinePanel() {
  const allEntries = useStore((s) => s.entries);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const toggleTimelineGroupCollapse = useStore((s) => s.toggleTimelineGroupCollapse);
  const removeTimelineGroup = useStore((s) => s.removeTimelineGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
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
            onAddGroup={(label) => addTimelineGroup(label)}
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
  const [headerHovered, setHeaderHovered] = useState(false);
  const entryCount = hourGroups.reduce((sum, hg) => sum + hg.entries.length, 0) + unknownEntries.length;

  const labelEditor = useGroupLabelEditor({
    initialLabel: group.label,
    onSave: (newLabel) => onUpdate(group.id, { label: newLabel }),
  });

  const deleteConfirm = useDeleteWithConfirmation(
    entryCount > 0,
    () => onRemove(group.id),
  );

  return (
    <div>
      {/* グループヘッダー */}
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        onClick={labelEditor.isEditing ? undefined : () => onToggleCollapse(group.id)}
        className="flex items-center gap-2 px-2.5 py-[7px] cursor-pointer select-none"
        style={{
          background: 'color-mix(in srgb, var(--panel-timeline-accent) 5%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
        }}
      >
        {/* 折りたたみ矢印 */}
        <span
          className="flex items-center shrink-0 text-panel-timeline-accent transition-transform duration-150"
          style={{
            transform: group.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown size={12} />
        </span>

        {/* ラベル */}
        {labelEditor.isEditing ? (
          <input
            autoFocus
            value={labelEditor.draftLabel}
            onChange={(e) => labelEditor.setDraftLabel(e.target.value)}
            onBlur={labelEditor.saveLabel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={labelEditor.handleKeyDown}
            aria-label="メモグループ名を編集"
            className="flex-1 bg-bg-base border border-panel-timeline-accent rounded-sm text-panel-timeline-accent text-sm font-semibold px-1.5 py-px outline-none"
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-panel-timeline-accent tracking-[0.06em]">
            {group.label}
          </span>
        )}

        {/* 並び替え矢印 — ホバー時のみ表示 */}
        {!labelEditor.isEditing && (onMoveUp || onMoveDown) && (
          <span
            className="flex items-center gap-px"
            style={{ opacity: headerHovered ? 0.8 : 0, transition: 'opacity 0.15s' }}
          >
            <button
              disabled={!onMoveUp}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              aria-label={`${group.label}を上に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveUp ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveUp) e.currentTarget.style.color = 'var(--panel-timeline-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowUp size={14} />
            </button>
            <button
              disabled={!onMoveDown}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              aria-label={`${group.label}を下に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveDown ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveDown) e.currentTarget.style.color = 'var(--panel-timeline-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowDown size={14} />
            </button>
          </span>
        )}

        {/* 編集ボタン — ホバー時のみ表示 */}
        {!labelEditor.isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              labelEditor.startEditing();
            }}
            title="メモグループ名を変更"
            aria-label={`${group.label}の名前を変更`}
            className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
            style={{
              opacity: headerHovered ? 0.8 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--panel-timeline-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <SquarePen size={14} />
          </button>
        )}

        {/* 削除ボタン — ホバー時のみ表示 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteConfirm.requestDelete();
          }}
          title="メモグループを削除"
          aria-label={`${group.label}を削除`}
          className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
          style={{
            opacity: headerHovered ? 1 : 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <X size={14} />
        </button>

        {/* エントリ数 — 常に右端 */}
        <span className="text-sm text-text-muted font-mono min-w-4 text-right opacity-70 shrink-0">
          {entryCount}
        </span>
      </div>

      {/* グループ内容 */}
      {!group.collapsed && (
        // --tl-spine-x: 縦線・ドットの中心X座標の単一の真実の情報源
        // 縦線・HourDividerドットはともにこの値から位置を計算するため、値を変えれば両方追従する
        <div className="relative py-2.5" style={{ '--tl-spine-x': '15px' } as React.CSSProperties}>
          {/* 縦線 — 上下余白部分は破線、中央は実線 */}
          <div
            className="absolute top-0 bottom-0 w-0"
            style={{ left: 'var(--tl-spine-x)' }}
          >
            {/* 上部破線 */}
            <div
              className="absolute top-0 h-2.5"
              style={{
                borderLeft: '1px dashed color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
              }}
            />
            {/* 中央実線 */}
            <div
              className="absolute top-2.5 bottom-2.5"
              style={{
                borderLeft: '1px solid color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)',
              }}
            />
            {/* 下部破線 */}
            <div
              className="absolute bottom-0 h-2.5"
              style={{
                borderLeft: '1px dashed color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
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

      {/* 削除確認モーダル */}
      <ConfirmModal
        open={deleteConfirm.isModalOpen}
        onClose={deleteConfirm.closeModal}
        title={`「${group.label}」を削除`}
        confirmationLabel={`メモが ${entryCount}件 一緒に削除されることを理解しました`}
        actions={[
          {
            label: '削除',
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: () => onRemove(group.id),
          },
        ]}
      />
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
        className={`text-sm font-mono tracking-[0.06em] shrink-0 opacity-80 ${
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
