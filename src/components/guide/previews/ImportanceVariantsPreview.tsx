import { EntryCardView } from '@/components/entries/entryCardView';
import { TextEntryView } from '@/components/entries/textEntryView';
import { StateLabel } from '@/components/guide/parts/StateLabel';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_IMPORTANCE_ENTRIES,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';

const IMPORTANCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: '低',
  medium: '中',
  high: '高',
};

/**
 * 重要度（低 / 中 / 高）のエントリを 3 枚並べるプレビュー。
 *
 * 本体の `EntryCardView` + `TextEntryView` をそのまま使い、各カードの
 * 重要度グラデーション・右端アイコンの色変化を一望できるようにする。
 */
export function ImportanceVariantsPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {GUIDE_SAMPLE_IMPORTANCE_ENTRIES.map((entry) => {
        const importance = entry.importance ?? 'low';
        return (
          <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StateLabel>{`重要度: ${IMPORTANCE_LABEL[importance]}`}</StateLabel>
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
        );
      })}
    </div>
  );
}
