import { useMemo } from 'react';

import { SearchLinkButton } from '@/components/common/searchLinkButton';
import { useT } from '@/i18n';
import { parseCharacterText } from '@/lib/parseCharacterText';
import type { Character, LinkKeyword, MemoEntry } from '@/types/memo';

interface EntryContentViewProps {
  /** 表示するエントリ本体 */
  entry: MemoEntry;
  /** インライン色付け対象になる可視キャラクター */
  visibleCharacters: Character[];
  /** リンク辞書のキーワード（`[[xxx]]` 表記と既存ワードのハイライト判定に使用） */
  linkKeywords: LinkKeyword[];
  /** 検索リンクのクリックハンドラ。Guide など store を持たない場面では noop でよい */
  onSearchClick?: (keyword: string) => void;
}

/**
 * `EntryContent` のテキスト閲覧モードを切り出した純粋表示版。
 *
 * - props で必要なデータを全て受け取り、`useStore` には触れない
 * - 編集機能（textarea / フォーカス管理 / 下書き保存）は持たず、テキストの「表示」だけを行う
 * - キャラクター名のインライン色付け、`[[キーワード]]` 検索リンクまでを担当
 * - CharacterBadgeBar の呼び出しは呼び出し側の責務（編集モード時も同じバーを共有するため）
 * - Guide ページのように本物の store に依存できない場面でそのまま使える
 */
export function EntryContentView({
  entry,
  visibleCharacters,
  linkKeywords,
  onSearchClick,
}: EntryContentViewProps) {
  const t = useT();
  const segments = useMemo(
    () => parseCharacterText(entry.content, visibleCharacters, linkKeywords),
    [entry.content, visibleCharacters, linkKeywords],
  );

  if (!entry.content) {
    return <span className="text-text-faint">{t('entries.content.empty')}</span>;
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.content}</span>;
        }
        if (seg.type === 'search-link') {
          return (
            <SearchLinkButton
              key={i}
              keyword={seg.keyword}
              onClick={onSearchClick ?? (() => undefined)}
            />
          );
        }
        return (
          <span key={i} style={{ color: seg.character.color, fontWeight: 600 }}>
            {seg.character.name}
          </span>
        );
      })}
    </>
  );
}
