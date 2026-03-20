import { useCallback, useMemo, useState } from 'react';

import { getHourKey, getHourLabel } from '../../lib/time-parser';
import { useStore } from '../../store';
import type { MemoEntry, TimelineGroup } from '../../types/memo';
import { EntryCard } from '../entries/EntryCard';
import { EntryInput } from '../entries/EntryInput';

export function TimelinePanel() {
  const allEntries = useStore((s) => s.entries);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const toggleTimelineGroupCollapse = useStore((s) => s.toggleTimelineGroupCollapse);
  const removeTimelineGroup = useStore((s) => s.removeTimelineGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);

  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

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
        .sort((a, b) => a.eventTimeSortKey! - b.eventTimeSortKey!);

      const hourGroups: { hour: number; label: string; entries: MemoEntry[] }[] = [];
      for (const entry of withTime) {
        const hour = getHourKey(entry.eventTimeSortKey!);
        const existing = hourGroups.find((g) => g.hour === hour);
        if (existing) {
          existing.entries.push(entry);
        } else {
          hourGroups.push({
            hour,
            label: getHourLabel(entry.eventTimeSortKey!),
            entries: [entry],
          });
        }
      }

      const unknown = groupEntries
        .filter((e) => e.eventTimeSortKey == null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return { group, hourGroups, unknown };
    });
  }, [timelineGroups, timelineEntries]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    await addTimelineGroup(label);
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, addTimelineGroup]);

  const isEmpty = timelineGroups.length === 0;

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isEmpty ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
              lineHeight: 2,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }}>
              <rect x="4" y="2" width="20" height="24" rx="3" stroke="var(--panel-timeline-accent)" strokeWidth="1.2" />
              <line x1="9" y1="8" x2="19" y2="8" stroke="var(--panel-timeline-accent)" strokeWidth="1" strokeLinecap="round" />
              <line x1="9" y1="12" x2="16" y2="12" stroke="var(--panel-timeline-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <line x1="9" y1="16" x2="18" y2="16" stroke="var(--panel-timeline-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <line x1="9" y1="20" x2="14" y2="20" stroke="var(--panel-timeline-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            </svg>
            日付グループを追加して<br />タイムラインを整理しよう
          </div>
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
            />
          ))
        )}

        {/* グループ追加 */}
        <div style={{ padding: '6px 10px 10px' }}>
          {isAddingGroup ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <input
                autoFocus
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGroup();
                  if (e.key === 'Escape') {
                    setIsAddingGroup(false);
                    setNewGroupLabel('');
                  }
                }}
                placeholder="当日、前日、3年前 等"
                aria-label="タイムライングループ名"
                style={{
                  flex: 1,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--panel-timeline-accent)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  padding: '4px 8px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddGroup}
                style={{
                  background: 'var(--panel-timeline-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--bg-base)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingGroup(false);
                  setNewGroupLabel('');
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingGroup(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: 12,
                padding: '5px 10px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--panel-timeline-accent)';
                e.currentTarget.style.color = 'var(--panel-timeline-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              グループを追加
            </button>
          )}
        </div>
      </div>

      <EntryInput panel="timeline" />
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
}

function TimelineGroupSection({
  group,
  hourGroups,
  unknownEntries,
  onToggleCollapse,
  onRemove,
  onUpdate,
}: TimelineGroupSectionProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(group.label);
  const [headerHovered, setHeaderHovered] = useState(false);
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          background: 'color-mix(in srgb, var(--panel-timeline-accent) 5%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* 折りたたみ矢印 */}
        <button
          onClick={() => onToggleCollapse(group.id)}
          aria-label={group.collapsed ? '展開' : '折りたたみ'}
          aria-expanded={!group.collapsed}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--panel-timeline-accent)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s',
            transform: group.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ラベル */}
        {isEditingLabel ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveLabel();
              if (e.key === 'Escape') {
                setDraftLabel(group.label);
                setIsEditingLabel(false);
              }
            }}
            aria-label="グループ名を編集"
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
            onClick={() => {
              setDraftLabel(group.label);
              setIsEditingLabel(true);
            }}
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

        {/* エントリ数 */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            minWidth: 16,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          {entryCount}
        </span>

        {/* 削除ボタン — ホバー時のみ表示 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (entryCount > 0) {
              if (confirm(`「${group.label}」と所属する${entryCount}件のメモを削除しますか？`)) {
                onRemove(group.id);
              }
            } else {
              onRemove(group.id);
            }
          }}
          title="グループを削除"
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
      </div>

      {/* グループ内容 */}
      {!group.collapsed && (
        // --tl-spine-x: 縦線・ドットの中心X座標の単一の真実の情報源
        // 縦線・HourDividerドットはともにこの値から位置を計算するため、値を変えれば両方追従する
        <div style={{ position: 'relative', '--tl-spine-x': '15px' } as React.CSSProperties}>
          {/* 縦線左端 = spine-x。ドット中心も spine-x なのでドットが線を中央で挟む。
               整数pxのみ使用 → 解像度によるサブピクセルぶれなし */}
          <div
            style={{
              position: 'absolute',
              left: 'var(--tl-spine-x)',
              top: 0,
              bottom: 0,
              width: 1,
              background: 'color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)',
            }}
          />

          <div style={{ paddingLeft: 6 }}>
            {/* 時間帯グループ */}
            {hourGroups.map((hg) => (
              <div key={hg.hour}>
                <HourDivider label={hg.label} />
                {hg.entries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    hideTime={i > 0 && entry.eventTime === hg.entries[i - 1].eventTime}
                  />
                ))}
              </div>
            ))}

            {/* 不明グループ */}
            {unknownEntries.length > 0 && (
              <div>
                <HourDivider label="不明" muted />
                {unknownEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
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
    </div>
  );
}

/** 時間帯の区切りライン */
function HourDivider({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        // paddingLeft = spine-x(15) - outer(6) - radius(3) = 6px
        // → ドット中心 = 6 + 6 + 3 = 15px = spine-x = 縦線左端 ✓ (整数pxのみ)
        padding: '3px 8px 1px',
        paddingLeft: 'calc(var(--tl-spine-x) - 9px)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: muted
            ? 'var(--text-faint)'
            : 'var(--panel-timeline-accent)',
          opacity: muted ? 0.6 : 0.7,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: muted ? 'var(--text-faint)' : 'var(--text-muted)',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: muted
            ? 'color-mix(in srgb, var(--border-subtle) 40%, transparent)'
            : 'color-mix(in srgb, var(--panel-timeline-accent) 10%, transparent)',
        }}
      />
    </div>
  );
}
