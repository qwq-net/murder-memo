import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useEntryDraft } from '@/hooks/useEntryDraft';
import { useImageBlob } from '@/hooks/useImageBlob';
import { detectInlineCharacterIds, parseCharacterText } from '@/lib/parseCharacterText';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { CharacterBadgeBar } from '@/components/characters/characterBadgeBar';
import { ImageLightbox } from '@/components/common/imageLightbox';

/** サムネイルの高さ — テキスト2行分相当 (13px * 1.2 * 2 + padding ≒ 40px) */
const THUMB_HEIGHT = 40;

interface ImageEntryProps {
  entry: MemoEntry;
  isHovered: boolean;
}

export function ImageEntry({ entry, isHovered }: ImageEntryProps) {
  const src = useImageBlob(entry.imageBlobKey);
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const openSearchWith = useStore((s) => s.openSearchWith);
  const settings = useStore((s) => s.settings);
  const allCharacters = useStore((s) => s.characters);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isEditing = focusedEntryId === entry.id;

  const panelDefault = settings.defaultCharacterDisplay[entry.panel];
  const effectiveFormat = entry.characterDisplayFormat ?? panelDefault.format;
  const effectiveVisibility = entry.characterDisplayVisibility ?? panelDefault.visibility;

  // showInEntries のキャラクターのみをパース対象にする
  const visibleCharacters = useMemo(
    () => allCharacters.filter((c) => c.showInEntries),
    [allCharacters],
  );

  // 閲覧モード用: キャプションテキスト → セグメント列
  const segments = useMemo(
    () => parseCharacterText(entry.content, visibleCharacters),
    [entry.content, visibleCharacters],
  );

  // バッジバーから重複排除するためにインライン検出済み ID を渡す
  const inlineDetectedIds = useMemo(
    () => detectInlineCharacterIds(entry.content, visibleCharacters),
    [entry.content, visibleCharacters],
  );

  // ── キャプション編集（EntryContent と同パターン） ──
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { resize } = useAutoResizeTextarea();

  const { draft, setDraft, handleBlur: draftBlur, handleEscape: draftEscape, resetGuards } =
    useEntryDraft({
      entryId: entry.id,
      currentValues: { content: entry.content },
      isEditing,
      onSave: (values) => {
        updateEntry(entry.id, { content: values.content.trim() });
      },
    });

  // 編集モードに入った瞬間だけ focus（useLayoutEffect で DOM マウント後に実行）
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
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing, resize, resetGuards]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // dnd-kit の KeyboardSensor に到達するのを防止
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        draftEscape();
        inputRef.current?.blur();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    },
    [draftEscape],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* サムネイル + キャプション */}
      <div className="pl-3.5 pr-2.5 pt-px pb-0 flex items-start gap-2">
        {/* サムネイル画像 */}
        {src ? (
          <img
            src={src}
            alt=""
            onClick={() => setLightboxOpen(true)}
            className="block rounded-sm border border-border-subtle cursor-pointer shrink-0 object-cover"
            style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
          />
        ) : (
          <div
            className="shrink-0 rounded-sm border border-border-subtle flex items-center justify-center text-text-faint text-[10px]"
            style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
          >
            …
          </div>
        )}

        {/* キャプション */}
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={draft.content}
            placeholder="キャプションを入力"
            onChange={(e) => {
              setDraft({ content: e.target.value });
              resize(e.target);
            }}
            onBlur={draftBlur}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full bg-transparent border-none outline-none text-text-primary font-sans text-sm leading-[1.2] p-0 m-0 resize-none overflow-hidden block"
            style={{ minHeight: THUMB_HEIGHT }}
          />
        ) : (
          <div
            onClick={(e) => {
              if (e.shiftKey) return;
              setFocusedEntry(entry.id);
            }}
            className="cursor-text pt-px whitespace-pre-wrap break-words text-sm leading-[1.2] min-w-0 flex-1"
            style={{ minHeight: THUMB_HEIGHT }}
          >
            {!entry.content ? (
              <span className="text-text-faint">キャプションを入力</span>
            ) : (
              segments.map((seg, i) => {
                if (seg.type === 'text') {
                  return <span key={i}>{seg.content}</span>;
                }
                if (seg.type === 'search-link') {
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
      </div>

      {/* 役職マーカー */}
      <div className="pl-3.5 pr-2.5 pb-0.5">
        <CharacterBadgeBar
          entry={entry}
          format={effectiveFormat}
          visibility={effectiveVisibility}
          isEntryHovered={isHovered || isEditing}
          inlineDetectedIds={inlineDetectedIds}
        />
      </div>

      {/* ライトボックス */}
      {src && (
        <ImageLightbox
          src={src}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
