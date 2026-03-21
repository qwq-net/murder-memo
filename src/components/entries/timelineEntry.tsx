import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useCaretPosition } from '@/hooks/useCaretPosition';
import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

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
  const cancelledRef = useRef(false);
  const blurHandledRef = useRef(false);
  const { applyPendingCursor, captureFromMouseEvent } = useCaretPosition();
  const { resize } = useAutoResizeTextarea();

  // 編集モードに入った瞬間だけ focus + カーソル復元を行う（毎レンダーでは実行しない）
  const editInitRef = useRef(false);
  useLayoutEffect(() => {
    if (!isEditing) {
      editInitRef.current = false;
      return;
    }
    if (editInitRef.current) return;
    editInitRef.current = true;
    cancelledRef.current = false;
    blurHandledRef.current = false;
    resize(contentRef.current);

    if (focusTargetRef.current === 'time') {
      timeRef.current?.focus();
    } else {
      const el = contentRef.current;
      if (!el) return;
      el.focus();
      applyPendingCursor(el);
    }
  }, [isEditing, resize, applyPendingCursor]);

  const [prevSyncKey, setPrevSyncKey] = useState({
    content: entry.content,
    eventTime: entry.eventTime,
    isEditing,
  });
  if (
    entry.content !== prevSyncKey.content ||
    entry.eventTime !== prevSyncKey.eventTime ||
    isEditing !== prevSyncKey.isEditing
  ) {
    setPrevSyncKey({ content: entry.content, eventTime: entry.eventTime, isEditing });
    if (!isEditing) {
      setDraftContent(entry.content);
      setDraftTime(entry.eventTime ?? '');
    }
  }

  // onBlurから呼ばれる唯一の保存ポイント（二重実行防止付き）
  const handleBlur = useCallback(() => {

    if (blurHandledRef.current) return;
    blurHandledRef.current = true;
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setFocusedEntry(null);
      return;
    }
    const timeTrimmed = autoCompleteTime(draftTime);
    const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
    updateEntry(entry.id, {
      content: draftContent.trim(),
      eventTime: timeTrimmed || undefined,
      eventTimeSortKey: sortKey,
    });
    setFocusedEntry(null);

  }, [draftContent, draftTime, entry.id, updateEntry, setFocusedEntry]);

  if (isEditing) {
    return (
      <div style={{
        padding: '1px 4px 2px var(--tl-entry-pad-left)',
        display: 'flex',
        gap: 'var(--tl-time-gap)',
        alignItems: 'flex-start',
      }}>
        <input
          ref={timeRef}
          value={draftTime}
          onChange={(e) => setDraftTime(normalizeTimeInput(e.target.value))}
          onKeyDown={(e) => {
            // 編集中のキーイベントが dnd-kit の KeyboardSensor に到達するのを防止
            e.stopPropagation();
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); contentRef.current?.focus(); }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelledRef.current = true;
              setDraftContent(entry.content);
              setDraftTime(entry.eventTime ?? '');
              timeRef.current?.blur();
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              contentRef.current?.focus();
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            setDraftTime((v) => autoCompleteTime(v));
            // コンテンツtextareaへの移動でなければ保存
            if (!e.relatedTarget || e.relatedTarget !== contentRef.current) {
              handleBlur();
            }
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--panel-timeline-accent)'; }}
          placeholder="--:--"
          aria-label="時刻"
          style={{
            width: 'var(--tl-time-width)',
            flexShrink: 0,
            boxSizing: 'border-box',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            color: draftTime ? 'var(--panel-timeline-accent)' : 'var(--text-faint)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.2,
            padding: '2px 4px',
            textAlign: 'center',
            letterSpacing: '0.04em',
            transition: 'border-color 0.15s',
          }}
        />
        <textarea
          ref={contentRef}
          value={draftContent}
          onChange={(e) => {
            setDraftContent(e.target.value);
            resize(e.target);
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // 編集中のキーイベントが dnd-kit の KeyboardSensor に到達するのを防止
            e.stopPropagation();

            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              contentRef.current?.blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelledRef.current = true;
              setDraftContent(entry.content);
              setDraftTime(entry.eventTime ?? '');
              contentRef.current?.blur();
            }
            if (e.key === 'Tab') {
              e.preventDefault();
            }
          }}
          rows={1}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.2,
            padding: '3px 0 0 6px',
            margin: 0,
            resize: 'none',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        cursor: 'text',
        padding: '1px 4px 0 var(--tl-entry-pad-left)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--tl-time-gap)',
        minHeight: 22,
      }}
    >
      {/* 時刻 or 不明 — クリックで時刻にフォーカス */}
      <span
        onClick={(e) => {
          if (e.shiftKey) return;

          focusTargetRef.current = 'time';
          setFocusedEntry(entry.id);
        }}
        style={{
          width: 'var(--tl-time-width)',
          flexShrink: 0,
          border: '1px solid transparent',
          padding: '2px 4px',
          boxSizing: 'border-box' as const,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          letterSpacing: '0.04em',
          color: entry.eventTime
            ? 'var(--panel-timeline-accent)'
            : 'var(--text-faint)',
          textAlign: 'center',
          cursor: 'text',
        }}
      >
        {hideTime ? '' : (entry.eventTime ?? '')}
      </span>

      {/* テキスト */}
      <span
        onMouseUp={(e) => {
          if (e.shiftKey) return;

          focusTargetRef.current = 'content';
          captureFromMouseEvent(e, entry.content.length);
          setFocusedEntry(entry.id);
        }}
        style={{
          fontSize: 13,
          lineHeight: 1.2,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flex: 1,
          color: 'var(--text-primary)',
          paddingTop: 3,
          paddingLeft: 6,
        }}
      >
        {entry.content || (
          <span style={{ color: 'var(--text-faint)' }}>空のメモ</span>
        )}
      </span>
    </div>
  );
}
