import { EntryCardView } from '@/components/entries/entryCardView';
import { TextEntryView } from '@/components/entries/textEntryView';
import { StateLabel } from '@/components/guide/parts/StateLabel';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_LINK_KEYWORDS,
  GUIDE_SAMPLE_LINK_SYNTAX_ENTRY,
} from '@/components/guide/previews/sampleData';

/**
 * `[キーワード]` 記法 + 自動リンク化の動作を 2 つの状態で見せるプレビュー。
 *
 * - 1 枚目: 辞書未登録の状態（linkKeywords を空で渡す）
 *   → 本文中の `[ペーパーナイフ]` は ` 角括弧つきの文字列のまま表示される
 *   （`parseCharacterText` の出力 = search-link セグメントになるため、実際は破線下線が付く）
 * - 2 枚目: 辞書に登録済みの状態（既存の GUIDE_SAMPLE_LINK_KEYWORDS を渡す）
 *   → `ペーパーナイフ` が辞書ヒットして同じく search-link 表示になる
 *
 * 本物の `EntryContentView` を 2 回使い、同一文字列でもリンクキーワード辞書の有無で
 * パース結果が変わる様子を示す。
 */
export function LinkSyntaxPreview() {
  const entry = GUIDE_SAMPLE_LINK_SYNTAX_ENTRY;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StateLabel>辞書未登録（[キーワード] のみ）</StateLabel>
        <EntryCardView entry={entry}>
          <TextEntryView
            entry={entry}
            visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
            linkKeywords={[]}
            isHovered={false}
            format="badge"
            visibility="always"
          />
        </EntryCardView>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StateLabel>辞書登録済み（同じ文章 / 辞書ヒットも自動リンク化）</StateLabel>
        <EntryCardView entry={entry}>
          <TextEntryView
            entry={entry}
            visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
            linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
            isHovered={false}
            format="badge"
            visibility="always"
          />
        </EntryCardView>
      </div>
    </div>
  );
}
