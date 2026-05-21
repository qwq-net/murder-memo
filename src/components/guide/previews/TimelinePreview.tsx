import { useState } from 'react';

import { EntryCardView } from '@/components/entries/entryCardView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { TimelineEntryView } from '@/components/entries/timelineEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_LINK_KEYWORDS,
  GUIDE_SAMPLE_TIMELINE_ENTRIES,
} from '@/components/guide/previews/sampleData';

/**
 * Guide 用タイムラインプレビュー。
 *
 * 本体の `EntryCardView` + `TimelineEntryView` + `EntryContentView` を組み合わせて表示する。
 * useStore に触れず、サンプルデータを props で流し込むだけでアプリ本体と同じ見た目になる。
 */
export function TimelinePreview() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {GUIDE_SAMPLE_TIMELINE_ENTRIES.map((entry) => {
        const isHovered = hoveredId === entry.id;
        return (
          <EntryCardView
            key={entry.id}
            entry={entry}
            hovered={isHovered}
            onMouseEnter={() => setHoveredId(entry.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <TimelineEntryView eventTime={entry.eventTime ?? ''}>
              <div className="pt-px pr-1 pb-0 pl-3.5 text-sm leading-[1.2] break-words whitespace-pre-wrap">
                <EntryContentView
                  entry={entry}
                  visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
                  linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
                />
              </div>
            </TimelineEntryView>
          </EntryCardView>
        );
      })}
    </div>
  );
}
