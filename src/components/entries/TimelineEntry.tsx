import { useCallback, useEffect, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '../../lib/time-parser';
import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';

interface TimelineEntryProps {
  entry: MemoEntry;
  hideTime?: boolean;
}

export function TimelineEntry({ entry, hideTime }: TimelineEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);

  const isEditing = focusedEntryId === entry.id;
  const [draftContent, setDraftContent] = useState(entry.content);
  const [draftTime, setDraftTime] = useState(entry.eventTime ?? '');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const focusTargetRef = useRef<'time' | 'content'>('content');

  useEffect(() => {
    if (isEditing) {
      const target = focusTargetRef.current === 'time' ? timeRef.current : contentRef.current;
      target?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setDraftContent(entry.content);
      setDraftTime(entry.eventTime ?? '');
    }
  }, [entry.content, entry.eventTime, isEditing]);

  const save = useCallback(() => {
    const timeTrimmed = autoCompleteTime(draftTime);
    const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
    updateEntry(entry.id, {
      content: draftContent.trim(),
      eventTime: timeTrimmed || undefined,
      eventTimeSortKey: sortKey,
    });
    setFocusedEntry(null);
  }, [draftContent, draftTime, entry.id, updateEntry, setFocusedEntry]);

  const cancel = useCallback(() => {
    setDraftContent(entry.content);
    setDraftTime(entry.eventTime ?? '');
    setFocusedEntry(null);
  }, [entry.content, entry.eventTime, setFocusedEntry]);

  if (isEditing) {
    return (
      <div style={{
        padding: '2px 10px 3px',
        display: 'flex',
        gap: 6,
        alignItems: 'flex-start',
      }}>
        <input
          ref={timeRef}
          value={draftTime}
          onChange={(e) => setDraftTime(normalizeTimeInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); contentRef.current?.focus(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          placeholder="--:--"
          aria-label="時刻"
          style={{
            width: 52,
            flexShrink: 0,
            background: 'var(--bg-base)',
            border: '1px solid var(--panel-timeline-accent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--panel-timeline-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '4px 4px',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        />
        <textarea
          ref={contentRef}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          rows={Math.max(1, draftContent.split('\n').length)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--bg-base)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.6,
            padding: '3px 8px',
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        cursor: 'text',
        padding: '1px 10px 2px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 22,
      }}
    >
      {/* 時刻 or 未明 — クリックで時刻にフォーカス */}
      <span
        onClick={() => {
          focusTargetRef.current = 'time';
          setFocusedEntry(entry.id);
        }}
        style={{
          width: 44,
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.04em',
          color: entry.eventTime
            ? 'var(--panel-timeline-accent)'
            : 'var(--text-faint)',
          textAlign: 'center',
          cursor: 'text',
          fontStyle: entry.eventTime ? 'normal' : 'italic',
        }}
      >
        {hideTime ? '' : (entry.eventTime ?? '')}
      </span>

      {/* テキスト — クリックでテキストにフォーカス */}
      <span
        onClick={() => {
          focusTargetRef.current = 'content';
          setFocusedEntry(entry.id);
        }}
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
          color: 'var(--text-primary)',
        }}
      >
        {entry.content || (
          <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>空のメモ</span>
        )}
      </span>
    </div>
  );
}
