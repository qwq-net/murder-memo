import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '../../lib/time-parser';
import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';

interface EntryInputProps {
  panel: PanelId;
}

export function EntryInput({ panel }: EntryInputProps) {
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const inputPosition = useStore((s) => s.settings.inputPosition);

  const [value, setValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  // グループ一覧
  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  const effectiveGroupId = isTimeline && timelineGroups.length === 1 && !selectedGroupId
    ? timelineGroups[0].id
    : selectedGroupId;

  const MAX_INPUT_HEIGHT = 120;

  const resizeInput = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT);
    el.style.height = next + 'px';
    el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    resizeInput(inputRef.current);
  }, [value, resizeInput]);

  const submit = useCallback(async () => {
    const text = value.trim();
    if (!text) return;
    if (isTimeline && !effectiveGroupId) return;

    const timeTrimmed = autoCompleteTime(timeValue);
    const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
    const defaultType = isTimeline ? 'timeline' as const : 'text' as const;
    const memoGroupId = isMemoPanel && selectedGroupId ? selectedGroupId : undefined;

    await addEntry({
      content: text,
      panel,
      type: defaultType,
      ...(isTimeline ? {
        timelineGroupId: effectiveGroupId,
        eventTime: timeTrimmed || undefined,
        eventTimeSortKey: sortKey,
      } : {}),
      ...(memoGroupId ? { groupId: memoGroupId } : {}),
    });
    setValue('');
    setTimeValue('');

    requestAnimationFrame(() => {
      if (isTimeline && timeRef.current) {
        timeRef.current.focus();
      } else {
        inputRef.current?.focus();
      }
    });
  }, [value, timeValue, panel, isTimeline, isMemoPanel, effectiveGroupId, selectedGroupId, addEntry]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    if (isTimeline) {
      const group = await addTimelineGroup(label);
      setSelectedGroupId(group.id);
    } else if (isMemoPanel) {
      const group = await addMemoGroup(label, panel as 'free' | 'personal');
      setSelectedGroupId(group.id);
    }
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, isTimeline, isMemoPanel, panel, addTimelineGroup, addMemoGroup]);

  const disabled = isTimeline && timelineGroups.length === 0;
  const isTop = inputPosition === 'top';

  // ── グループセレクタ + 追加ボタン行（常に表示） ──
  const groupRow = (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', minHeight: 24 }}>
      {/* グループセレクタ */}
      <select
        value={effectiveGroupId}
        onChange={(e) => setSelectedGroupId(e.target.value)}
        aria-label="追加先グループ"
        style={{
          flex: 1,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          padding: '3px 6px',
          outline: 'none',
        }}
      >
        {isTimeline ? (
          <>
            <option value="">{groups.length === 0 ? 'グループなし' : 'グループを選択…'}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        ) : (
          <>
            <option value="">未分類</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        )}
      </select>

      {/* グループ追加 */}
      {isAddingGroup ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
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
            onBlur={() => {
              if (!newGroupLabel.trim()) {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            placeholder={isTimeline ? '当日、前日 等' : 'グループ名'}
            aria-label="グループ名"
            style={{
              flex: 1,
              minWidth: 60,
              background: 'var(--bg-base)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '3px 6px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddGroup}
            style={{
              background: '#c45a2a',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          title="メモグループを追加"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ marginRight: 4 }}>
            <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          グループ
        </button>
      )}
    </div>
  );

  // ── 入力行 ──
  const inputRow = (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', minHeight: 24 }}>
      {isTimeline && (
        <input
          ref={timeRef}
          value={timeValue}
          onChange={(e) => setTimeValue(normalizeTimeInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
          placeholder="--:--"
          disabled={disabled}
          aria-label="時刻"
          style={{
            width: 44,
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border-default)',
            color: 'var(--panel-timeline-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: '1px 2px',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.05em',
            transition: 'border-color 0.15s',
            opacity: disabled ? 0.4 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--panel-timeline-accent)'; }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = 'var(--border-default)';
            setTimeValue((v) => autoCompleteTime(v));
          }}
        />
      )}

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          resizeInput(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={
          disabled
            ? 'まずメモグループを追加してください'
            : 'メモを入力… (Shift+Enter で改行)'
        }
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          lineHeight: 1.6,
          padding: '1px 0',
          resize: 'none',
          outline: 'none',
          overflow: 'hidden',
          opacity: disabled ? 0.4 : 1,
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        padding: '6px 10px 8px',
        borderTop: isTop ? undefined : '1px solid var(--border-subtle)',
        borderBottom: isTop ? '1px solid var(--border-subtle)' : undefined,
        background: 'var(--bg-surface)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {groupRow}
      {inputRow}
    </div>
  );
}
