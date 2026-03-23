import { memo, useMemo } from 'react';

import type { MemoEntry, PanelId } from '@/types/memo';

const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

/** マッチ箇所を <mark> でハイライトしたスニペットを生成 */
function buildSnippet(content: string, query: string): React.ReactNode[] {
  const lower = content.toLowerCase();
  const q = query.toLowerCase();
  const firstIdx = lower.indexOf(q);
  if (firstIdx === -1) return [content.slice(0, 120)];

  // マッチ周辺 ~120 文字を切り出す
  const contextRadius = 50;
  const start = Math.max(0, firstIdx - contextRadius);
  const end = Math.min(content.length, firstIdx + query.length + contextRadius);
  const slice = content.slice(start, end);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < content.length ? '…' : '';

  // スライス内のマッチ箇所をすべてハイライト
  const sliceLower = slice.toLowerCase();
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let matchIdx = sliceLower.indexOf(q, cursor);

  if (prefix) nodes.push(prefix);

  while (matchIdx !== -1) {
    if (matchIdx > cursor) {
      nodes.push(slice.slice(cursor, matchIdx));
    }
    nodes.push(
      <mark key={matchIdx}>{slice.slice(matchIdx, matchIdx + query.length)}</mark>,
    );
    cursor = matchIdx + query.length;
    matchIdx = sliceLower.indexOf(q, cursor);
  }

  if (cursor < slice.length) {
    nodes.push(slice.slice(cursor));
  }

  if (suffix) nodes.push(suffix);

  return nodes;
}

interface SearchResultItemProps {
  entry: MemoEntry;
  query: string;
  onSelect: (entry: MemoEntry) => void;
}

export const SearchResultItem = memo(function SearchResultItem({
  entry,
  query,
  onSelect,
}: SearchResultItemProps) {
  const snippet = useMemo(() => buildSnippet(entry.content, query), [entry.content, query]);
  const accent = PANEL_ACCENT[entry.panel];

  return (
    <button
      className="flex items-start gap-2 w-full text-left px-3 py-2 cursor-pointer border-none bg-transparent transition-colors duration-100 hover:bg-bg-hover"
      onClick={() => onSelect(entry)}
    >
      {/* パネルアクセントバー */}
      <div
        className="shrink-0 rounded-sm self-stretch"
        style={{ width: 3, background: accent, opacity: 0.6 }}
      />
      {/* テキストスニペット */}
      <span className="text-[13px] leading-[1.6] text-text-secondary whitespace-pre-wrap break-all min-w-0">
        {snippet}
      </span>
    </button>
  );
});
