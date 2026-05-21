import { useMemo } from 'react';

import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { detectInlineCharacterIds } from '@/lib/parseCharacterText';
import type {
  Character,
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  LinkKeyword,
  MemoEntry,
} from '@/types/memo';

/** サムネイルの高さ — テキスト2行分相当 (13px * 1.2 * 2 + padding ≒ 40px) */
const THUMB_HEIGHT = 40;

interface ImageEntryViewProps {
  /** 表示するエントリ */
  entry: MemoEntry;
  /** インライン色付け対象の可視キャラクター */
  visibleCharacters: Character[];
  /** リンク辞書 */
  linkKeywords: LinkKeyword[];
  /**
   * 解決済みの画像 URL。`useImageBlob` 等で IDB から取得した値を呼び出し側で渡す。
   * `undefined` の場合はプレースホルダ枠を表示する。
   */
  imageSrc?: string;
  /** バッジ表示形式 */
  format: CharacterDisplayFormat;
  /** バッジ表示モード */
  visibility: CharacterDisplayVisibility;
  /** カードのホバー状態 */
  isHovered: boolean;
  /** サムネイルクリック時のハンドラ。Guide では noop 可 */
  onLightboxOpen?: () => void;
  /** 検索リンクのクリックハンドラ。Guide では noop 可 */
  onSearchClick?: (keyword: string) => void;
  /** バッジトグルのハンドラ。Guide では noop 可 */
  onCharacterToggle?: (characterId: string) => void;
}

/**
 * `ImageEntry` の閲覧表示を切り出した純粋表示版。
 *
 * - サムネイル + キャプション本文 + バッジバーの 3 要素で構成
 * - useStore / useImageBlob / useEntryDraft に依存しない。画像 URL は props で受ける
 * - 編集モード（textarea / 下書き保存）は持たない（呼び出し側で別途実装）
 */
export function ImageEntryView({
  entry,
  visibleCharacters,
  linkKeywords,
  imageSrc,
  format,
  visibility,
  isHovered,
  onLightboxOpen,
  onSearchClick,
  onCharacterToggle,
}: ImageEntryViewProps) {
  const inlineDetectedIds = useMemo(
    () => detectInlineCharacterIds(entry.content, visibleCharacters, linkKeywords),
    [entry.content, visibleCharacters, linkKeywords],
  );
  const badgeCharacters = useMemo(
    () => visibleCharacters.filter((c) => !inlineDetectedIds.includes(c.id)),
    [visibleCharacters, inlineDetectedIds],
  );
  const activeCharacterIds = useMemo(() => new Set(entry.characterTags), [entry.characterTags]);
  const hasEffectiveActive = useMemo(() => {
    const effective = new Set([...entry.characterTags, ...inlineDetectedIds]);
    return visibleCharacters.some((c) => effective.has(c.id));
  }, [visibleCharacters, entry.characterTags, inlineDetectedIds]);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* サムネイル + キャプション */}
      <div className="flex items-start gap-2 pt-px pr-2.5 pb-0 pl-3.5">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            onClick={onLightboxOpen}
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

        {/* キャプション（閲覧モード） */}
        <div
          className="min-w-0 flex-1 cursor-text pt-px text-sm leading-[1.2] break-words whitespace-pre-wrap"
          style={{ minHeight: THUMB_HEIGHT }}
        >
          {!entry.content ? (
            <span className="text-text-faint">キャプションを入力</span>
          ) : (
            <EntryContentView
              entry={entry}
              visibleCharacters={visibleCharacters}
              linkKeywords={linkKeywords}
              onSearchClick={onSearchClick}
            />
          )}
        </div>
      </div>

      {/* 役職マーカー */}
      <div className="pr-2.5 pb-0.5 pl-3.5">
        <CharacterBadgeBarView
          characters={badgeCharacters}
          activeCharacterIds={activeCharacterIds}
          onToggle={onCharacterToggle ?? (() => undefined)}
          format={format}
          visibility={visibility}
          isEntryHovered={isHovered}
          hasEffectiveActive={hasEffectiveActive}
        />
      </div>
    </div>
  );
}
