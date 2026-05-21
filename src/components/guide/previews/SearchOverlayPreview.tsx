import { useState } from 'react';

import {
  GUIDE_SAMPLE_SEARCH_QUERY,
  GUIDE_SAMPLE_SEARCH_RESULTS,
} from '@/components/guide/previews/sampleData';
import { SearchOverlayShellView } from '@/components/search/searchOverlayShellView';
import { SearchResultItem } from '@/components/search/searchResultItem';
import type { MemoEntry, PanelId } from '@/types/memo';

const PANEL_TITLES: Record<PanelId, string> = {
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

function groupByPanel(entries: MemoEntry[]): { panel: PanelId; entries: MemoEntry[] }[] {
  const order: PanelId[] = ['timeline', 'free', 'personal'];
  return order
    .map((panel) => ({ panel, entries: entries.filter((e) => e.panel === panel) }))
    .filter((g) => g.entries.length > 0);
}

/**
 * 検索パレットのプレビュー。
 *
 * 本物の `SearchOverlayShellView` + `SearchResultItem` を使い、パネル別のグループ表示と
 * クエリハイライト（`<mark>`）が `/app` と同じスタイルで表示されることを示す。
 * 検索クエリは内部 state で編集可能だが、ヒット件数は固定（サンプルデータの 3 件）。
 */
export function SearchOverlayPreview() {
  const [query, setQuery] = useState(GUIDE_SAMPLE_SEARCH_QUERY);
  const grouped = groupByPanel(GUIDE_SAMPLE_SEARCH_RESULTS);
  const totalCount = GUIDE_SAMPLE_SEARCH_RESULTS.length;

  return (
    <SearchOverlayShellView
      query={query}
      onQueryChange={setQuery}
      totalCount={totalCount}
      showEmpty={false}
    >
      {grouped.map((group) => (
        <div key={group.panel}>
          <div
            className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase"
            style={{
              color: PANEL_ACCENT[group.panel],
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                background: PANEL_ACCENT[group.panel],
                opacity: 0.7,
              }}
            />
            {PANEL_TITLES[group.panel]}
            <span className="text-text-muted ml-1 font-normal">{group.entries.length}件</span>
          </div>
          {group.entries.map((entry) => (
            <SearchResultItem
              key={entry.id}
              entry={entry}
              query={query}
              onSelect={() => undefined}
            />
          ))}
        </div>
      ))}
    </SearchOverlayShellView>
  );
}
