import { memo, useMemo } from 'react';

import { PANEL_ACCENT } from '@/lib/panelMeta';
import { buildSnippetSegments } from '@/lib/searchHighlight';
import type { MemoEntry } from '@/types/memo';

interface SearchResultItemProps {
  entry: MemoEntry;
  /** ハイライト対象キーワード（小文字・スペース分解済み） */
  terms: string[];
  /** 本文以外（タグ）で一致したキャラクター名 */
  matchedCharacterNames: string[];
  /** 本文以外（所属グループ名）で一致したグループ名 */
  matchedGroupLabel: string | null;
  onSelect: (entry: MemoEntry) => void;
}

export const SearchResultItem = memo(function SearchResultItem({
  entry,
  terms,
  matchedCharacterNames,
  matchedGroupLabel,
  onSelect,
}: SearchResultItemProps) {
  const segments = useMemo(
    () => buildSnippetSegments(entry.content, terms),
    [entry.content, terms],
  );
  const accent = PANEL_ACCENT[entry.panel];
  const hasContext = matchedCharacterNames.length > 0 || !!matchedGroupLabel;

  return (
    <button
      className="hover:bg-bg-hover flex w-full cursor-pointer items-start gap-2 border-none bg-transparent px-3 py-2 text-left transition-colors duration-100"
      onClick={() => onSelect(entry)}
    >
      {/* パネルアクセントバー */}
      <div
        className="shrink-0 self-stretch rounded-sm"
        style={{ width: 3, background: accent, opacity: 0.6 }}
      />
      {/* テキストスニペット + 一致理由 */}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-text-secondary text-sm leading-[1.6] break-all whitespace-pre-wrap">
          {segments.map((seg, i) =>
            seg.highlighted ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>,
          )}
        </span>
        {hasContext && (
          <span className="flex flex-wrap items-center gap-1">
            {matchedGroupLabel && (
              <span
                className="text-text-muted inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px]"
                style={{ background: 'var(--bg-active)' }}
              >
                {matchedGroupLabel}
              </span>
            )}
            {matchedCharacterNames.map((name) => (
              <span
                key={name}
                className="text-text-muted inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px]"
                style={{ background: 'var(--bg-active)' }}
              >
                @{name}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
});
