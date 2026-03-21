import { useCallback, useMemo, useState } from 'react';

import { getHourKey, getHourLabel } from '../../lib/time-parser';
import { useStore } from '../../store';
import type { MemoEntry, TimelineGroup } from '../../types/memo';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { EntryInput } from '../entries/EntryInput';
import { SortableEntryList } from '../entries/SortableEntryList';

export function TimelinePanel() {
  const allEntries = useStore((s) => s.entries);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const toggleTimelineGroupCollapse = useStore((s) => s.toggleTimelineGroupCollapse);
  const removeTimelineGroup = useStore((s) => s.removeTimelineGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const inputPosition = useStore((s) => s.settings.inputPosition);

  const timelineEntries = useMemo(
    () => allEntries.filter((e) => e.panel === 'timeline'),
    [allEntries],
  );

  const groupedData = useMemo(() => {
    return timelineGroups.map((group) => {
      const groupEntries = timelineEntries.filter(
        (e) => e.timelineGroupId === group.id,
      );

      const withTime = groupEntries
        .filter((e) => e.eventTimeSortKey != null)
        .sort((a, b) => a.eventTimeSortKey! - b.eventTimeSortKey! || a.sortOrder - b.sortOrder);

      // Map で O(1) ルックアップ（find の O(n) を回避）
      const hourMap = new Map<number, { hour: number; label: string; entries: MemoEntry[] }>();
      const hourGroups: { hour: number; label: string; entries: MemoEntry[] }[] = [];
      for (const entry of withTime) {
        const hour = getHourKey(entry.eventTimeSortKey!);
        const existing = hourMap.get(hour);
        if (existing) {
          existing.entries.push(entry);
        } else {
          const group = { hour, label: getHourLabel(entry.eventTimeSortKey!), entries: [entry] };
          hourMap.set(hour, group);
          hourGroups.push(group);
        }
      }

      const unknown = groupEntries
        .filter((e) => e.eventTimeSortKey == null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return { group, hourGroups, unknown };
    });
  }, [timelineGroups, timelineEntries]);

  const isEmpty = timelineGroups.length === 0;

  const entryInput = <EntryInput panel="timeline" />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 60 }}>
        {isEmpty ? (
          <EmptyState
            accentColor="var(--panel-timeline-accent)"
            message="メモグループを追加してタイムラインを整理しよう"
            onAddGroup={(label) => addTimelineGroup(label)}
          />
        ) : (
          groupedData.map(({ group, hourGroups, unknown }) => (
            <TimelineGroupSection
              key={group.id}
              group={group}
              hourGroups={hourGroups}
              unknownEntries={unknown}
              onToggleCollapse={toggleTimelineGroupCollapse}
              onRemove={removeTimelineGroup}
              onUpdate={updateTimelineGroup}
              onReorderEntries={(ids) => reorderEntries('timeline', ids)}
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
}

function TimelineGroupSection({
  group,
  hourGroups,
  unknownEntries,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onReorderEntries,
}: TimelineGroupSectionProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(group.label);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const entryCount = hourGroups.reduce((sum, hg) => sum + hg.entries.length, 0) + unknownEntries.length;

  const saveLabel = useCallback(() => {
    const label = draftLabel.trim();
    if (label && label !== group.label) {
      onUpdate(group.id, { label });
    }
    setIsEditingLabel(false);
  }, [draftLabel, group.id, group.label, onUpdate]);

  return (
    <div>
      {/* グループヘッダー */}
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        onClick={isEditingLabel ? undefined : () => onToggleCollapse(group.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          background: 'color-mix(in srgb, var(--panel-timeline-accent) 5%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* 折りたたみ矢印 */}
        <span
          style={{
            color: 'var(--panel-timeline-accent)',
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s',
            transform: group.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        {/* ラベル */}
        {isEditingLabel ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={saveLabel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveLabel();
              if (e.key === 'Escape') {
                setDraftLabel(group.label);
                setIsEditingLabel(false);
              }
            }}
            aria-label="メモグループ名を編集"
            style={{
              flex: 1,
              background: 'var(--bg-base)',
              border: '1px solid var(--panel-timeline-accent)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--panel-timeline-accent)',
              fontSize: 12,
              fontWeight: 600,
              padding: '1px 6px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--panel-timeline-accent)',
              letterSpacing: '0.06em',
            }}
          >
            {group.label}
          </span>
        )}

        {/* 編集ボタン — ホバー時のみ表示 */}
        {!isEditingLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDraftLabel(group.label);
              setIsEditingLabel(true);
            }}
            title="メモグループ名を変更"
            aria-label={`${group.label}の名前を変更`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, opacity 0.15s',
              opacity: headerHovered ? 0.8 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--panel-timeline-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* 削除ボタン — ホバー時のみ表示 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (entryCount > 0) {
              setDeleteModalOpen(true);
            } else {
              onRemove(group.id);
            }
          }}
          title="メモグループを削除"
          aria-label={`${group.label}を削除`}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: '0 2px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s, opacity 0.15s',
            opacity: headerHovered ? 1 : 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="3" y1="3" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* エントリ数 — 常に右端 */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            minWidth: 16,
            textAlign: 'right',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          {entryCount}
        </span>
      </div>

      {/* グループ内容 */}
      {!group.collapsed && (
        // --tl-spine-x: 縦線・ドットの中心X座標の単一の真実の情報源
        // 縦線・HourDividerドットはともにこの値から位置を計算するため、値を変えれば両方追従する
        <div style={{ position: 'relative', '--tl-spine-x': '15px', padding: '16px 0' } as React.CSSProperties}>
          {/* 縦線 — 上下余白部分は破線、中央は実線 */}
          <div
            style={{
              position: 'absolute',
              left: 'var(--tl-spine-x)',
              top: 0,
              bottom: 0,
              width: 0,
            }}
          >
            {/* 上部破線 */}
            <div style={{
              position: 'absolute',
              top: 0,
              height: 16,
              borderLeft: '1px dashed color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
            }} />
            {/* 中央実線 */}
            <div style={{
              position: 'absolute',
              top: 16,
              bottom: 16,
              borderLeft: '1px solid color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)',
            }} />
            {/* 下部破線 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              height: 16,
              borderLeft: '1px dashed color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
            }} />
          </div>

          <div style={{ paddingLeft: 6 }}>
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
                <HourDivider label="不明" muted />
                <SortableEntryList
                  entries={unknownEntries}
                  onReorder={onReorderEntries}
                />
              </div>
            )}

            {/* 空の場合 */}
            {hourGroups.length === 0 && unknownEntries.length === 0 && (
              <div
                style={{
                  padding: '14px 12px',
                  fontSize: 12,
                  color: 'var(--text-faint)',
                  textAlign: 'center',
                }}
              >
                メモを追加してください
              </div>
            )}
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px 2px 0',
      }}
    >
      {/* 左ライン — 縦線とクロスする */}
      <span style={{ flex: 1, height: 1, background: lineColor }} />
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: muted ? 'var(--text-faint)' : 'var(--text-muted)',
          letterSpacing: '0.06em',
          flexShrink: 0,
          opacity: 0.8,
        }}
      >
        {label}
      </span>
      {/* 右ライン */}
      <span style={{ flex: 1, height: 1, background: lineColor }} />
    </div>
  );
}
