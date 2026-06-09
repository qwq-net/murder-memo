/**
 * タイムラインエントリ。時刻列 + コンテンツ（テキスト or 画像）で構成。
 * 時刻は常に input で表示し、フォーカス時にスタイルが変わる。
 * テキスト編集は EntryContent に、画像は ImageEntry にそれぞれ委譲する。
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { EntryContent } from '@/components/entries/entryContent';
import { ImageEntry } from '@/components/entries/imageEntry';
import { isCancelEscape, isCommitEnter } from '@/lib/keyboardKeys';
import { normalizeTimeInput, resolveEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

interface TimelineEntryProps {
  entry: MemoEntry;
  hideTime?: boolean;
  isHovered: boolean;
}

export function TimelineEntry({ entry, hideTime, isHovered }: TimelineEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const timeEditRequestId = useStore((s) => s.timeEditRequestId);
  const clearTimeEditRequest = useStore((s) => s.clearTimeEditRequest);

  const isEditing = focusedEntryId === entry.id;
  const isImage = !!entry.imageBlobKey;
  const [draftTime, setDraftTime] = useState(entry.eventTime ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  // EntryContent が公開する本文ドラフト確定関数（編集終了時に本文＋時刻をまとめて保存するため）
  const contentCommitRef = useRef<(() => void) | null>(null);
  // 時刻 input の DOM 参照（「時刻を設定」メニューからの編集開始時にフォーカスするため）
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  /**
   * 時刻 span クリックで編集に入った場合 true（textarea ではなく time input にフォーカスする）。
   * autoFocus 属性で render 中に参照するため state で管理する。
   */
  const [focusTime, setFocusTime] = useState(false);

  // 時刻の props → draft 同期（非編集時のみ）
  const [prevTimeSync, setPrevTimeSync] = useState({ eventTime: entry.eventTime, isEditing });
  if (entry.eventTime !== prevTimeSync.eventTime || isEditing !== prevTimeSync.isEditing) {
    setPrevTimeSync({ eventTime: entry.eventTime, isEditing });
    if (!isEditing) setDraftTime(entry.eventTime ?? '');
  }

  // 「時刻を設定」メニュー等からの時刻フォーカス要求を消費する。編集に入った際、本文ではなく
  // 時刻入力へ DOM フォーカスを移す（state を介さず DOM 直接操作。useLayoutEffect なので
  // EntryContent の textarea 自動フォーカス（子の layout effect）の後に走り、最終的に時刻入力が勝つ）。
  useLayoutEffect(() => {
    if (isEditing && timeEditRequestId === entry.id) {
      timeInputRef.current?.focus();
      clearTimeEditRequest();
    }
  }, [isEditing, timeEditRequestId, entry.id, clearTimeEditRequest]);

  // 時刻保存
  const saveTime = useCallback(() => {
    const resolved = resolveEventTime(draftTime);
    if (!resolved.valid) {
      // 不正な時刻は保存せず直前の値に戻す（eventTime と sortKey の不整合を防ぐ）
      setDraftTime(entry.eventTime ?? '');
      return;
    }
    setDraftTime(resolved.eventTime ?? '');
    updateEntry(entry.id, {
      eventTime: resolved.eventTime,
      eventTimeSortKey: resolved.eventTimeSortKey,
    });
  }, [draftTime, entry.id, entry.eventTime, updateEntry]);

  // テキストエントリ用：content + 時刻をまとめて保存
  const handleContentSave = useCallback(
    (content: string) => {
      const resolved = resolveEventTime(draftTime);
      if (!resolved.valid) {
        // 時刻が不正なら content だけ保存し、時刻は直前の値に据え置く
        setDraftTime(entry.eventTime ?? '');
        updateEntry(entry.id, { content });
        return;
      }
      updateEntry(entry.id, {
        content,
        eventTime: resolved.eventTime,
        eventTimeSortKey: resolved.eventTimeSortKey,
      });
    },
    [draftTime, entry.id, entry.eventTime, updateEntry],
  );

  // 時刻 input の blur
  const handleTimeBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = 'transparent';
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.placeholder = '';
      if (isImage) {
        // 画像エントリ: 本文編集は無いので時刻のみ保存
        saveTime();
        return;
      }
      // テキストエントリ: コンテナ内（textarea）への移動なら編集継続（保存しない）
      if (containerRef.current?.contains(e.relatedTarget as Node)) return;
      // コンテナ外へ抜ける＝エントリ全体の編集終了。
      // 時刻だけ保存して本文ドラフトを捨てる事故を防ぐため、本文＋時刻をまとめて確定する。
      const commitContent = contentCommitRef.current;
      if (commitContent) {
        // EntryContent.draftBlur: onSave(=handleContentSave で本文＋時刻を保存) + setFocusedEntry(null)
        commitContent();
      } else {
        // 本文確定関数が未公開の場合のフォールバック（時刻のみ保存して編集終了）
        saveTime();
        setFocusedEntry(null);
      }
    },
    [isImage, saveTime, setFocusedEntry],
  );

  // 時刻 input の keyDown
  const handleTimeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (isCommitEnter(e)) {
        e.preventDefault();
        if (isImage) {
          (e.target as HTMLInputElement).blur();
        } else {
          // テキストエントリ: textarea にフォーカス移動
          containerRef.current?.querySelector('textarea')?.focus();
        }
      } else if (isCancelEscape(e)) {
        // IME 変換中の Escape は変換キャンセルとして消費させる
        e.preventDefault();
        setDraftTime(entry.eventTime ?? '');
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Tab' && !isImage) {
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
            setFocusTime(true);
            setFocusedEntry(entry.id);
          }}
          style={{ ...timeStyle, cursor: 'text' }}
        >
          {hideTime ? '' : (entry.eventTime ?? '')}
        </span>
      ) : (
        <input
          autoFocus={focusTime}
          ref={(el) => {
            timeInputRef.current = el;
            if (el && focusTime) {
              el.focus();
              // フォーカスを当てた直後にフラグを下ろす（1 回のみ発火させる）
              setFocusTime(false);
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
          autoFocus={!focusTime}
          containerRef={containerRef}
          commitDraftRef={contentCommitRef}
        />
      )}
    </div>
  );
}
