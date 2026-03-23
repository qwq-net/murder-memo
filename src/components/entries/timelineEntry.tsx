/**
 * タイムラインエントリ。時刻列 + コンテンツ（テキスト or 画像）で構成。
 * 時刻は常に input で表示し、フォーカス時にスタイルが変わる。
 * テキスト編集は EntryContent に、画像は ImageEntry にそれぞれ委譲する。
 */
import { useCallback, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { EntryContent } from '@/components/entries/entryContent';
import { ImageEntry } from '@/components/entries/imageEntry';

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
  const isImage = !!entry.imageBlobKey;
  const [draftTime, setDraftTime] = useState(entry.eventTime ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  /** 時刻 span クリックで編集に入った場合 true（textarea ではなく time input にフォーカスする） */
  const focusTimeRef = useRef(false);

  // 時刻の props → draft 同期（非編集時のみ）
  const [prevTimeSync, setPrevTimeSync] = useState({ eventTime: entry.eventTime, isEditing });
  if (entry.eventTime !== prevTimeSync.eventTime || isEditing !== prevTimeSync.isEditing) {
    setPrevTimeSync({ eventTime: entry.eventTime, isEditing });
    if (!isEditing) setDraftTime(entry.eventTime ?? '');
  }

  // 時刻保存
  const saveTime = useCallback(() => {
    const completed = autoCompleteTime(draftTime);
    setDraftTime(completed);
    const sortKey = completed ? parseEventTime(completed) : undefined;
    updateEntry(entry.id, {
      eventTime: completed || undefined,
      eventTimeSortKey: sortKey,
    });
  }, [draftTime, entry.id, updateEntry]);

  // テキストエントリ用：content + 時刻をまとめて保存
  const handleContentSave = useCallback(
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

  // 時刻 input の blur
  const handleTimeBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'transparent';
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.placeholder = '';
      // テキストエントリ: コンテナ内（textarea）への移動なら時刻だけ保存しない
      if (!isImage && containerRef.current?.contains(e.relatedTarget as Node)) return;
      // コンテナ外 or 画像エントリ → 時刻を保存
      saveTime();
      // テキストエントリの場合は編集終了
      if (!isImage) setFocusedEntry(null);
    },
    [isImage, saveTime, setFocusedEntry],
  );

  // 時刻 input の keyDown
  const handleTimeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (isImage) {
          (e.target as HTMLInputElement).blur();
        } else {
          // テキストエントリ: textarea にフォーカス移動
          containerRef.current?.querySelector('textarea')?.focus();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDraftTime(entry.eventTime ?? '');
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === 'Tab' && !isImage) {
        e.preventDefault();
        containerRef.current?.querySelector('textarea')?.focus();
      }
    },
    [isImage, entry.eventTime],
  );

  // 時刻列の共通スタイル
  const timeStyle: React.CSSProperties = {
    width: 'var(--tl-time-width)',
    flexShrink: 0,
    boxSizing: 'border-box',
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 1.2,
    letterSpacing: '0.04em',
    textAlign: 'center',
    padding: '2px 4px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    color: draftTime ? 'var(--panel-timeline-accent)' : 'var(--text-faint)',
    transition: 'border-color 0.15s, background 0.15s',
  };

  // テキストエントリの表示モード: span で時刻を表示（クリックで編集モード突入）
  const showTimeSpan = !isImage && !isEditing;

  return (
    <div
      ref={containerRef}
      style={{
        cursor: showTimeSpan ? 'text' : undefined,
        padding: '1px 4px 0 var(--tl-entry-pad-left)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--tl-time-gap)',
        minHeight: 22,
      }}
    >
      {/* 時刻列 */}
      {showTimeSpan ? (
        <span
          onClick={(e) => {
            if (e.shiftKey) return;
            focusTimeRef.current = true;
            setFocusedEntry(entry.id);
          }}
          style={{ ...timeStyle, cursor: 'text' }}
        >
          {hideTime ? '' : (entry.eventTime ?? '')}
        </span>
      ) : (
        <input
          autoFocus={focusTimeRef.current}
          ref={(el) => {
            if (el && focusTimeRef.current) {
              el.focus();
              focusTimeRef.current = false;
            }
          }}
          value={draftTime}
          onChange={(e) => setDraftTime(normalizeTimeInput(e.target.value))}
          onBlur={handleTimeBlur}
          onKeyDown={handleTimeKeyDown}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--panel-timeline-accent)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.placeholder = '--:--';
          }}
          placeholder=""
          aria-label="時刻"
          className="outline-none"
          style={timeStyle}
        />
      )}

      {/* コンテンツ */}
      {isImage ? (
        <ImageEntry entry={entry} isHovered={isHovered} />
      ) : (
        <EntryContent
          entry={entry}
          onSave={handleContentSave}
          isHovered={isHovered}
          onEscape={() => setDraftTime(entry.eventTime ?? '')}
          autoFocus={!focusTimeRef.current}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}
