/**
 * タイムラインエントリ。時刻列 + EntryContent（テキスト+バッジ）で構成。
 * 時刻の編集・表示ロジックのみ保持し、テキスト編集は EntryContent に委譲する。
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { EntryContent } from '@/components/entries/entryContent';

interface TimelineEntryProps {
  entry: MemoEntry;
  hideTime?: boolean;
  isHovered: boolean;
}

export function TimelineEntry({ entry, hideTime, isHovered }: TimelineEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);

  const isEditing = focusedEntryId === entry.id;
  const [draftTime, setDraftTime] = useState(entry.eventTime ?? '');
  const timeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTargetRef = useRef<'time' | 'content'>('content');

  // 時刻の props → draft 同期（非編集時のみ）
  const [prevTimeSync, setPrevTimeSync] = useState({ eventTime: entry.eventTime, isEditing });
  if (entry.eventTime !== prevTimeSync.eventTime || isEditing !== prevTimeSync.isEditing) {
    setPrevTimeSync({ eventTime: entry.eventTime, isEditing });
    if (!isEditing) setDraftTime(entry.eventTime ?? '');
  }

  // 時刻フォーカス: 編集開始時に focusTargetRef が 'time' なら時刻 input にフォーカス
  const timeInitRef = useRef(false);
  useLayoutEffect(() => {
    if (!isEditing) {
      timeInitRef.current = false;
      return;
    }
    if (timeInitRef.current) return;
    timeInitRef.current = true;
    if (focusTargetRef.current === 'time') {
      timeRef.current?.focus();
    }
  }, [isEditing]);

  // EntryContent に渡す保存コールバック（content + 時刻をまとめて保存）
  const handleSave = useCallback(
    (content: string) => {
      const timeTrimmed = autoCompleteTime(draftTime);
      const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
      updateEntry(entry.id, {
        content,
        eventTime: timeTrimmed || undefined,
        eventTimeSortKey: sortKey,
      });
    },
    [draftTime, entry.id, updateEntry],
  );

  // 時刻 input の blur（コンテナ内フォーカス移動なら保存スキップ）
  const handleTimeBlur = useCallback(
    (e: React.FocusEvent) => {
      (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border-subtle)';
      setDraftTime((v) => autoCompleteTime(v));
      // コンテナ内の別要素（content textarea）への移動なら保存しない
      if (containerRef.current?.contains(e.relatedTarget as Node)) return;
      // コンテナ外への移動 → 保存して編集終了
      const timeTrimmed = autoCompleteTime(draftTime);
      const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
      updateEntry(entry.id, {
        content: entry.content,
        eventTime: timeTrimmed || undefined,
        eventTimeSortKey: sortKey,
      });
      setFocusedEntry(null);
    },
    [draftTime, entry.id, entry.content, updateEntry, setFocusedEntry],
  );

  // ── 時刻列の共通スタイル ──
  const timeStyle = {
    width: 'var(--tl-time-width)',
    flexShrink: 0,
    boxSizing: 'border-box' as const,
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 1.2,
    letterSpacing: '0.04em',
    textAlign: 'center' as const,
    padding: '2px 4px',
  };

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        style={{
          padding: '1px 4px 2px var(--tl-entry-pad-left)',
          display: 'flex',
          gap: 'var(--tl-time-gap)',
          alignItems: 'flex-start',
        }}
      >
        {/* 時刻 input */}
        <input
          ref={timeRef}
          value={draftTime}
          onChange={(e) => setDraftTime(normalizeTimeInput(e.target.value))}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              // 時刻確定 → コンテナ内の textarea にフォーカス移動（blur で保存しない）
              containerRef.current?.querySelector('textarea')?.focus();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setDraftTime(entry.eventTime ?? '');
              timeRef.current?.blur();
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              containerRef.current?.querySelector('textarea')?.focus();
            }
          }}
          onBlur={handleTimeBlur}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--panel-timeline-accent)';
          }}
          placeholder="--:--"
          aria-label="時刻"
          style={{
            ...timeStyle,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            color: draftTime ? 'var(--panel-timeline-accent)' : 'var(--text-faint)',
            transition: 'border-color 0.15s',
          }}
        />
        {/* テキスト + バッジ */}
        <EntryContent
          entry={entry}
          onSave={handleSave}
          isHovered={isHovered}
          onEscape={() => setDraftTime(entry.eventTime ?? '')}
          autoFocus={focusTargetRef.current !== 'time'}
          containerRef={containerRef}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        cursor: 'text',
        padding: '1px 4px 0 var(--tl-entry-pad-left)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--tl-time-gap)',
        minHeight: 22,
      }}
    >
      {/* 時刻表示 — クリックで時刻にフォーカス */}
      <span
        onClick={(e) => {
          if (e.shiftKey) return;
          focusTargetRef.current = 'time';
          setFocusedEntry(entry.id);
        }}
        style={{
          ...timeStyle,
          border: '1px solid transparent',
          color: entry.eventTime ? 'var(--panel-timeline-accent)' : 'var(--text-faint)',
          cursor: 'text',
        }}
      >
        {hideTime ? '' : (entry.eventTime ?? '')}
      </span>

      {/* テキスト + バッジ */}
      <EntryContent
        entry={entry}
        onSave={handleSave}
        isHovered={isHovered}
        containerRef={containerRef}
      />
    </div>
  );
}
