import { useCallback, useEffect, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '../../lib/time-parser';
import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';

interface EntryInputProps {
  panel: PanelId;
}

export function EntryInput({ panel }: EntryInputProps) {
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const [value, setValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const isTimeline = panel === 'timeline';

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
    await addEntry({
      content: text,
      panel,
      type: defaultType,
      ...(isTimeline ? {
        timelineGroupId: effectiveGroupId,
        eventTime: timeTrimmed || undefined,
        eventTimeSortKey: sortKey,
      } : {}),
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
  }, [value, timeValue, panel, isTimeline, effectiveGroupId, addEntry]);

  const disabled = isTimeline && timelineGroups.length === 0;

  return (
    <div
      style={{
        padding: '6px 10px 8px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* グループセレクタ（複数グループ時） */}
      {isTimeline && timelineGroups.length > 1 && (
        <select
          value={effectiveGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          aria-label="追加先グループ"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            padding: '3px 6px',
            outline: 'none',
          }}
        >
          <option value="">グループを選択…</option>
          {timelineGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      )}

      {/* 入力行 */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
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
              ? 'まずグループを追加してください'
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
    </div>
  );
}
