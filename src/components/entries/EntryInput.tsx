import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { useLocalStorage } from '../../hooks/useLocalStorage';
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
  const [selectedGroupId, persistGroupId] = useLocalStorage(`murder-memo-selected-group-${panel}`, '');
  const [timeError, setTimeError] = useState(false);
  const [textError, setTextError] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const { resize: resizeInput } = useAutoResizeTextarea(120);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  // グループ一覧
  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  // selectedGroupId が現存するグループに含まれなければリセット
  const validSelectedId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId = isTimeline && timelineGroups.length === 1 && !validSelectedId
    ? timelineGroups[0].id
    : validSelectedId;

  useEffect(() => {
    resizeInput(inputRef.current);
  }, [value, resizeInput]);

  const submit = useCallback(async () => {
    const text = value.trim();
    const timeTrimmed = autoCompleteTime(timeValue);

    if (isTimeline) {
      if (!text && !timeTrimmed) return;
      if (timeTrimmed && !text) { setTextError(true); return; }
      if (!effectiveGroupId) return;
    } else {
      if (!text) return;
    }
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
  }, [value, timeValue, panel, isTimeline, isMemoPanel, effectiveGroupId, validSelectedId, addEntry]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    if (isTimeline) {
      const group = await addTimelineGroup(label);
      persistGroupId(group.id);
    } else if (isMemoPanel) {
      const group = await addMemoGroup(label, panel as 'free' | 'personal');
      persistGroupId(group.id);
    }
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, isTimeline, isMemoPanel, panel, addTimelineGroup, addMemoGroup, persistGroupId]);

  const disabled = isTimeline && timelineGroups.length === 0;
  const isTop = inputPosition === 'top';

  // ── グループセレクタ + 追加ボタン行（常に表示） ──
  const groupRow = (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', minHeight: 24 }}>
      {/* グループセレクタ */}
      <select
        value={effectiveGroupId}
        onChange={(e) => persistGroupId(e.target.value)}
        aria-label="追加先メモグループ"
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
            <option value="">{groups.length === 0 ? 'メモグループなし' : 'メモグループを選択…'}</option>
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
            placeholder={isTimeline ? '当日、前日 等' : 'メモグループ名'}
            aria-label="メモグループ名"
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
          メモグループ
        </button>
      )}
    </div>
  );

  // ── 入力行 ──
  const inputRow = (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', minHeight: 24 }}>
      {isTimeline && (
        <input
          ref={timeRef}
          value={timeValue}
          onChange={(e) => { setTimeValue(normalizeTimeInput(e.target.value)); setTimeError(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
          placeholder="--:--"
          disabled={disabled}
          aria-label="時刻"
          aria-invalid={timeError || undefined}
          aria-describedby={timeError ? 'entry-time-error' : undefined}
          style={{
            width: 44,
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            borderBottom: timeError ? '1px solid var(--importance-high)' : '1px solid var(--border-default)',
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
          setTextError(false);
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
        aria-invalid={textError || undefined}
        aria-describedby={textError ? 'entry-text-error' : undefined}
        rows={1}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          borderBottom: textError ? '1px solid var(--importance-high)' : undefined,
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
      {/* スクリーンリーダー用エラーメッセージ */}
      {timeError && <span id="entry-time-error" className="sr-only">時刻の形式が正しくありません</span>}
      {textError && <span id="entry-text-error" className="sr-only">テキストを入力してください</span>}
    </div>
  );
}
