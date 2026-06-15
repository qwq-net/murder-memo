import { useMemo } from 'react';

import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { ImageThumbnailView } from '@/components/entries/imageThumbnailView';
import { THUMB_HEIGHT } from '@/components/entries/thumbConstants';
import { useT } from '@/i18n';
import { computeBadgeCharacters } from '@/lib/characterBadges';
import type {
  Character,
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  LinkKeyword,
  MemoEntry,
} from '@/types/memo';

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
  const t = useT();
  // バッジ計算は TextEntryView と共通の純関数に集約
  const { badgeCharacters, activeCharacterIds, hasEffectiveActive } = useMemo(
    () => computeBadgeCharacters(entry, visibleCharacters, linkKeywords),
    [entry, visibleCharacters, linkKeywords],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* サムネイル + キャプション */}
      <div className="flex items-start gap-2 pt-px pr-2.5 pb-0 pl-3.5">
        <ImageThumbnailView src={imageSrc} onClick={onLightboxOpen} />

        {/* キャプション（閲覧モード） */}
        <div
          className="min-w-0 flex-1 cursor-text pt-px text-sm leading-[1.2] break-words whitespace-pre-wrap"
          style={{ minHeight: THUMB_HEIGHT }}
        >
          {!entry.content ? (
            <span className="text-text-faint">{t('entries.image.captionEmpty')}</span>
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
