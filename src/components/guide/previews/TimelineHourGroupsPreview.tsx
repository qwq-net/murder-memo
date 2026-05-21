import { EntryCardView } from '@/components/entries/entryCardView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { TimelineEntryView } from '@/components/entries/timelineEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_HOUR_GROUPED_ENTRIES,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';
import { HourDividerView } from '@/components/panels/hourDividerView';
import type { MemoEntry } from '@/types/memo';

interface HourGroup {
  /** "9:30" などの表示ラベル。空文字なら時刻なしグループ */
  label: string;
  entries: MemoEntry[];
}

/**
 * タイムラインの「時間帯セパレータ」と「不明セクション」を本物の View で見せるプレビュー。
 *
 * `TimelineGroupSection` 内部のロジックと同じく、時刻あり → 時間帯ごとに `HourDividerView` を
 * 挟む / 同時刻の重複は 2 件目以降をブランクで表示、時刻なしは最後に「不明」セパレータ + 並べる。
 */
function groupByHour(entries: MemoEntry[]): { withTime: HourGroup[]; withoutTime: MemoEntry[] } {
  const map = new Map<string, MemoEntry[]>();
  const withoutTime: MemoEntry[] = [];
  for (const entry of entries) {
    if (entry.eventTime) {
      const arr = map.get(entry.eventTime) ?? [];
      arr.push(entry);
      map.set(entry.eventTime, arr);
    } else {
      withoutTime.push(entry);
    }
  }
  const withTime: HourGroup[] = Array.from(map.entries())
    .sort((a, b) => (a[1][0].eventTimeSortKey ?? 0) - (b[1][0].eventTimeSortKey ?? 0))
    .map(([label, items]) => ({ label, entries: items }));
  return { withTime, withoutTime };
}

export function TimelineHourGroupsPreview() {
  const { withTime, withoutTime } = groupByHour(GUIDE_SAMPLE_HOUR_GROUPED_ENTRIES);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {withTime.map((group) => (
        <div key={group.label}>
          <HourDividerView label={group.label} />
          {group.entries.map((entry, i) => (
            <EntryCardView key={entry.id} entry={entry}>
              {/* 同時刻が連続する場合、2 件目以降は時刻列を空にして重複ラベル省略を再現 */}
              <TimelineEntryView eventTime={entry.eventTime ?? ''} hideTime={i > 0}>
                <div className="pt-px pr-1 pb-0 pl-3.5 text-sm leading-[1.2] break-words whitespace-pre-wrap">
                  <EntryContentView
                    entry={entry}
                    visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
                    linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
                  />
                </div>
              </TimelineEntryView>
            </EntryCardView>
          ))}
        </div>
      ))}
      {withoutTime.length > 0 && (
        <div>
          <HourDividerView label="不明" muted />
          {withoutTime.map((entry) => (
            <EntryCardView key={entry.id} entry={entry}>
              <TimelineEntryView eventTime="">
                <div className="pt-px pr-1 pb-0 pl-3.5 text-sm leading-[1.2] break-words whitespace-pre-wrap">
                  <EntryContentView
                    entry={entry}
                    visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
                    linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
                  />
                </div>
              </TimelineEntryView>
            </EntryCardView>
          ))}
        </div>
      )}
    </div>
  );
}
