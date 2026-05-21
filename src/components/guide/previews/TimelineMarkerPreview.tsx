import { EntryCardView } from '@/components/entries/entryCardView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { TimelineEntryView } from '@/components/entries/timelineEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_LINK_KEYWORDS,
  GUIDE_SAMPLE_TIMELINE_MARKER_ENTRY,
} from '@/components/guide/previews/sampleData';

/**
 * タイムラインカードに付くマーカー（左端のドット + 横線）の単体表示。
 *
 * 本体の `EntryCardView` + `TimelineEntryView` をそのまま使い、時刻付きエントリの
 * 左に SVG マーカーが描画される様子を見せる。
 */
export function TimelineMarkerPreview() {
  const entry = GUIDE_SAMPLE_TIMELINE_MARKER_ENTRY;

  return (
    <EntryCardView entry={entry}>
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
}
