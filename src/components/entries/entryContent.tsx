/**
 * テキスト編集 + 役職マーカー（CharacterBadgeBar）の共通コンポーネント。
 * TextEntry と TimelineEntry の両方から利用される。
 */
import { type RefObject, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useCaretPosition } from '@/hooks/useCaretPosition';
import { useEntryDraft } from '@/hooks/useEntryDraft';
import { detectInlineCharacterIds, parseCharacterText } from '@/lib/parseCharacterText';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { CharacterBadgeBar } from '@/components/characters/characterBadgeBar';

interface EntryContentProps {
  entry: MemoEntry;
  /** trim 済み content を受け取る保存コールバック */
  onSave: (trimmedContent: string) => void;
  /** EntryCard からのホバー状態 */
  isHovered: boolean;
  /** Escape キャンセル時の追加処理（TimelineEntry が draftTime リセットに利用） */
  onEscape?: () => void;
  /** false にすると編集開始時に textarea を自動フォーカスしない（TimelineEntry の時刻フォーカス用） */
  autoFocus?: boolean;
  /** コンテナ内フォーカス移動で blur 保存をスキップするための ref */
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function EntryContent({
  entry,
  onSave,
  isHovered,
  onEscape,
  autoFocus = true,
  containerRef,
}: EntryContentProps) {
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const openSearchWith = useStore((s) => s.openSearchWith);
  const settings = useStore((s) => s.settings);
  const allCharacters = useStore((s) => s.characters);

  const isEditing = focusedEntryId === entry.id;

  // showInEntries のキャラクターのみをパース対象にする
  const visibleCharacters = useMemo(
    () => allCharacters.filter((c) => c.showInEntries),
    [allCharacters],
  );

  // 閲覧モード用: テキスト → セグメント列（キャラ名 / プレーンテキスト）
  const segments = useMemo(
    () => parseCharacterText(entry.content, visibleCharacters),
    [entry.content, visibleCharacters],
  );

  // バッジバーから重複排除するためにインライン検出済み ID を渡す
  const inlineDetectedIds = useMemo(
    () => detectInlineCharacterIds(entry.content, visibleCharacters),
    [entry.content, visibleCharacters],
  );

  const panelDefault = settings.defaultCharacterDisplay[entry.panel];
  const effectiveFormat = entry.characterDisplayFormat ?? panelDefault.format;
  const effectiveVisibility = entry.characterDisplayVisibility ?? panelDefault.visibility;

  const { draft, setDraft, handleBlur: draftBlur, handleEscape: draftEscape, resetGuards } =
    useEntryDraft({
      entryId: entry.id,
      currentValues: { content: entry.content },
      isEditing,
      onSave: (values) => onSave(values.content.trim()),
    });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { applyPendingCursor, captureFromMouseEvent } = useCaretPosition();
  const { resize } = useAutoResizeTextarea();

  // 編集モードに入った瞬間だけ focus + カーソル復元を行う（毎レンダーでは実行しない）
  const editInitRef = useRef(false);
  useLayoutEffect(() => {
    if (!isEditing) {
      editInitRef.current = false;
      return;
    }
    if (editInitRef.current || !inputRef.current) return;
    editInitRef.current = true;
    resetGuards();
    const el = inputRef.current;
    resize(el);
    if (autoFocus) {
      el.focus();
      applyPendingCursor(el);
    }
  }, [isEditing, autoFocus, resize, applyPendingCursor, resetGuards]);

  // コンテナ内フォーカス移動なら blur 保存をスキップ
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (containerRef?.current?.contains(e.relatedTarget as Node)) return;
      draftBlur();
    },
    [containerRef, draftBlur],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 編集中のキーイベントが dnd-kit の KeyboardSensor に到達するのを防止
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        draftEscape();
        onEscape?.();
        inputRef.current?.blur();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    },
    [draftEscape, onEscape],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* テキスト */}
      {isEditing ? (
        <div className="pl-3.5 pr-2.5 pt-px pb-0">
          <textarea
            ref={inputRef}
            value={draft.content}
            onChange={(e) => {
              setDraft({ content: e.target.value });
              resize(e.target);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full bg-transparent border-none outline-none text-text-primary font-sans text-sm leading-[1.2] p-0 m-0 resize-none overflow-hidden block"
          />
        </div>
      ) : (
        <div
          onClick={(e) => {
            if (e.shiftKey) return;
            captureFromMouseEvent(e, entry.content.length);
            setFocusedEntry(entry.id);
          }}
          className="cursor-text pt-px pr-1 pb-0 pl-3.5 whitespace-pre-wrap break-words text-sm leading-[1.2]"
        >
          {!entry.content ? (
            <span className="text-text-faint">空のメモ</span>
          ) : (
            segments.map((seg, i) => {
              if (seg.type === 'text') {
                return <span key={i}>{seg.content}</span>;
              }
              if (seg.type === 'search-link') {
                // [キーワード] をクリッカブルな検索ショートカットとして表示
                return (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSearchWith(seg.keyword);
                    }}
                    title={`「${seg.keyword}」を検索`}
                    style={{
                      display: 'inline',
                      background: 'none',
                      border: 'none',
                      padding: '0 1px',
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      fontWeight: 500,
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dashed',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    {seg.keyword}
                  </button>
                );
              }
              // キャラクター名をインライン色付きテキストとして表示
              return (
                <span
                  key={i}
                  style={{ color: seg.character.color, fontWeight: 600 }}
                >
                  {seg.character.name}
                </span>
              );
            })
          )}
        </div>
      )}

      {/* 役職マーカー — テキストと同じ左右 padding で揃える */}
      <div className="pl-3.5 pr-2.5 pb-0.5">
        <CharacterBadgeBar
          entry={entry}
          format={effectiveFormat}
          visibility={effectiveVisibility}
          isEntryHovered={isHovered || isEditing}
          inlineDetectedIds={inlineDetectedIds}
        />
      </div>
    </div>
  );
}
