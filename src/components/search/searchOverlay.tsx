import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { SearchOverlayShellView } from '@/components/search/searchOverlayShellView';
import { SearchResultItem } from '@/components/search/searchResultItem';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { navigateToEntry } from '@/lib/entryNavigation';
import { searchEntries, tokenizeQuery } from '@/lib/entrySearch';
import { fullPanelOrder } from '@/lib/panelLayout';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';
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

const MAX_RESULTS = 50;
const DEBOUNCE_MS = 150;

export function SearchOverlay() {
  const isOpen = useStore((s) => s.isSearchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const searchInitialQuery = useStore((s) => s.searchInitialQuery);
  const entries = useStore((s) => s.entries);
  const characters = useStore((s) => s.characters);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const layout = useStore(selectResolvedLayout);
  // 非表示パネルのメモも検索結果に出す（クリック時に revealEntry が自動で再表示する）
  const order = useMemo(() => fullPanelOrder(layout), [layout]);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const revealEntry = useStore((s) => s.revealEntry);
  const addToast = useStore((s) => s.addToast);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // 開く瞬間（または開いた状態で初期クエリが変わった瞬間）に検索クエリを同期する。
  // useEffect 内の setState はカスケード再レンダーを招くため、render 中に直接比較・更新する。
  const [openSyncKey, setOpenSyncKey] = useState({ isOpen, searchInitialQuery });
  if (
    isOpen !== openSyncKey.isOpen ||
    (isOpen && searchInitialQuery !== openSyncKey.searchInitialQuery)
  ) {
    setOpenSyncKey({ isOpen, searchInitialQuery });
    if (isOpen) {
      setQuery(searchInitialQuery);
      setDebouncedQuery(searchInitialQuery);
    }
  }

  // フォーカス管理（DOM への副作用なので useEffect に残す）
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // 次フレームで autofocus
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // デバウンス
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const close = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  useEscapeKey(close, isOpen);

  // 検索結果をパネル順にグループ化（複数キーワード AND・本文/キャラ名/グループ名対象）
  const grouped = useMemo(
    () =>
      searchEntries(debouncedQuery, {
        entries,
        characters,
        timelineGroups,
        memoGroups,
        order,
        maxResults: MAX_RESULTS,
      }),
    [debouncedQuery, entries, characters, timelineGroups, memoGroups, order],
  );

  // ハイライト用のキーワード配列（searchEntries と同じ分解規則）
  const terms = useMemo(() => tokenizeQuery(debouncedQuery), [debouncedQuery]);

  const totalCount = useMemo(
    () => grouped.reduce((sum, g) => sum + g.matches.length, 0),
    [grouped],
  );

  // 結果クリック → 対象を可視化（折りたたみ展開・干渉フィルタ解除）してからスクロール＆ハイライト。
  // 折りたたみグループ内やフィルタ非表示のエントリでも遷移できるようにする（旧実装は無反応だった）。
  const handleSelect = useCallback(
    (entry: MemoEntry) => {
      close();
      revealEntry(entry);
      navigateToEntry(entry.id, entry.panel, setActivePanel, () =>
        addToast('対象のメモを表示できませんでした', 'error'),
      );
    },
    [close, setActivePanel, revealEntry, addToast],
  );

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 z-[59]"
        style={{ background: 'var(--shadow-overlay)' }}
        onClick={close}
      />

      {/* 検索パレット — 位置決め (fixed) のみここで指定し、中身は SearchOverlayShellView に委譲 */}
      <div
        className="fixed z-[60]"
        style={{
          top: 'var(--header-h)',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'search-in 0.15s ease-out',
        }}
      >
        <SearchOverlayShellView
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            if (next === '') inputRef.current?.focus();
          }}
          inputRef={inputRef}
          totalCount={debouncedQuery ? totalCount : undefined}
          maxReached={totalCount >= MAX_RESULTS}
          showEmpty={!!debouncedQuery && totalCount === 0}
        >
          {grouped.map((group) => (
            <div key={group.panel}>
              {/* パネルグループヘッダー */}
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
                <span className="text-text-muted ml-1 font-normal">{group.matches.length}件</span>
              </div>

              {/* エントリ一覧 */}
              {group.matches.map((match) => (
                <SearchResultItem
                  key={match.entry.id}
                  entry={match.entry}
                  terms={terms}
                  matchedCharacterNames={match.matchedCharacterNames}
                  matchedGroupLabel={match.matchedGroupLabel}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ))}
        </SearchOverlayShellView>
      </div>
    </>,
    document.body,
  );
}
