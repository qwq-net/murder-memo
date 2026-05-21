import { EntryCardView } from '@/components/entries/entryCardView';
import { TextEntryView } from '@/components/entries/textEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_INLINE_ENTRY,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';

/**
 * 本文中に登場する人物名が、人物ごとの色で自動的に色付け表示される様子を見せるプレビュー。
 *
 * 本体の `TextEntryView`（中で `EntryContentView`）をそのまま使うため、`parseCharacterText`
 * による分割と色付けロジックが本体と完全に同じ動作で再現される。
 */
export function InlineCharacterPreview() {
  const entry = GUIDE_SAMPLE_INLINE_ENTRY;

  return (
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
  );
}
