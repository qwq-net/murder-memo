import { useState } from 'react';

import { EntryCardView } from '@/components/entries/entryCardView';
import { TextEntryView } from '@/components/entries/textEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_FREE_ENTRIES,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';

/**
 * Guide 用フリーメモプレビュー。
 *
 * 本体の `EntryCardView` + `TextEntryView`（中で `EntryContentView` + `CharacterBadgeBarView`）
 * をそのまま使う。`useStore` に触れないため、`sampleData.ts` を流し込むだけで本体と同じ
 * カード装飾（左縦線・重要度グラデーション・バッジバー）が再現される。
 *
 * フリーメモのデフォルト表示は本体の設定パネルでは badge 形式・minimal モードだが、
 * Guide では「バッジの存在」と「色付け」をわかりやすく見せるため always に固定する。
 */
export function FreeMemoPreview() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {GUIDE_SAMPLE_FREE_ENTRIES.map((entry) => {
        const isHovered = hoveredId === entry.id;
        return (
          <EntryCardView
            key={entry.id}
            entry={entry}
            hovered={isHovered}
            onMouseEnter={() => setHoveredId(entry.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <TextEntryView
              entry={entry}
              visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
              linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
              isHovered={isHovered}
              format="badge"
              visibility="always"
            />
          </EntryCardView>
        );
      })}
    </div>
  );
}
