import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CharacterBadgeBar } from '@/components/characters/characterBadgeBar';
import { ImageLightbox } from '@/components/common/imageLightbox';
import { ImageEntryView } from '@/components/entries/imageEntryView';
import { useAutoRegisterLinkKeywords } from '@/hooks/useAutoRegisterLinkKeywords';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useEntryDraft } from '@/hooks/useEntryDraft';
import { useImageBlob } from '@/hooks/useImageBlob';
import { detectInlineCharacterIds } from '@/lib/parseCharacterText';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

/** サムネイルの高さ — テキスト2行分相当 (13px * 1.2 * 2 + padding ≒ 40px) */
const THUMB_HEIGHT = 40;

interface ImageEntryProps {
  entry: MemoEntry;
  isHovered: boolean;
}

/**
 * 画像エントリの店長ラッパー。
 *
 * - 閲覧モード: `ImageEntryView` に委譲（純粋表示）
 * - 編集モード: ここで textarea + draft 管理 + Lightbox 制御を行う
 * - サムネイル URL は `useImageBlob` で IDB から取得し、両モードで使う
 */
export function ImageEntry({ entry, isHovered }: ImageEntryProps) {
  const src = useImageBlob(entry.imageBlobKey);
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const openSearchWith = useStore((s) => s.openSearchWith);
  const settings = useStore((s) => s.settings);
  const allCharacters = useStore((s) => s.characters);
  const linkKeywords = useStore((s) => s.linkKeywords);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);
  const registerKeywords = useAutoRegisterLinkKeywords();
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

  // バッジバーから重複排除するためにインライン検出済み ID を渡す。
  // 辞書ワードと衝突したキャラ名は本文に出ないので、ここからも除外される。
  const inlineDetectedIds = useMemo(
    () => detectInlineCharacterIds(entry.content, visibleCharacters, linkKeywords),
    [entry.content, visibleCharacters, linkKeywords],
  );

  // ── キャプション編集（EntryContent と同パターン） ──
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { resize } = useAutoResizeTextarea();

  const {
    draft,
    setDraft,
    handleBlur: draftBlur,
    handleEscape: draftEscape,
    resetGuards,
  } = useEntryDraft({
    entryId: entry.id,
    currentValues: { content: entry.content },
    isEditing,
    onSave: (values) => {
      const trimmed = values.content.trim();
      // キャプション内の `[キーワード]` を辞書に自動登録する
      registerKeywords(trimmed);
      updateEntry(entry.id, { content: trimmed });
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

  // 編集モードのときは textarea + 編集用 DOM をここで描画する
  if (isEditing) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-start gap-2 pt-px pr-2.5 pb-0 pl-3.5">
          {src ? (
            <img
              src={src}
              alt=""
              onClick={() => setLightboxOpen(true)}
              className="border-border-subtle block shrink-0 cursor-pointer rounded-sm border object-cover"
              style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
            />
          ) : (
            <div
              className="border-border-subtle text-text-faint flex shrink-0 items-center justify-center rounded-sm border text-[10px]"
              style={{ height: THUMB_HEIGHT, width: THUMB_HEIGHT }}
            >
              …
            </div>
          )}
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
            className="text-text-primary m-0 block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-sans text-sm leading-[1.2] outline-none"
            style={{ minHeight: THUMB_HEIGHT }}
          />
        </div>
        <div className="pr-2.5 pb-0.5 pl-3.5">
          <CharacterBadgeBar
            entry={entry}
            format={effectiveFormat}
            visibility={effectiveVisibility}
            isEntryHovered={isHovered || isEditing}
            inlineDetectedIds={inlineDetectedIds}
          />
        </div>
        {src && (
          <ImageLightbox src={src} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
        )}
      </div>
    );
  }

  // 閲覧モードは ImageEntryView に委譲
  return (
    <div
      onClick={(e) => {
        if (e.shiftKey) return;
        setFocusedEntry(entry.id);
      }}
      style={{ flex: 1, minWidth: 0 }}
    >
      <ImageEntryView
        entry={entry}
        visibleCharacters={visibleCharacters}
        linkKeywords={linkKeywords}
        imageSrc={src ?? undefined}
        format={effectiveFormat}
        visibility={effectiveVisibility}
        isHovered={isHovered || isEditing}
        onLightboxOpen={() => setLightboxOpen(true)}
        onSearchClick={openSearchWith}
        onCharacterToggle={(charId) => toggleCharacterTag(entry.id, charId)}
      />
      {src && (
        <ImageLightbox src={src} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
