import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Search, X } from '@/components/icons';
import { SearchResultItem } from '@/components/search/searchResultItem';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { navigateToEntry } from '@/lib/entryNavigation';
import { useStore } from '@/store';
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
  const order = useStore((s) => s.layout.order);
  const setActivePanel = useStore((s) => s.setActivePanel);

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

  // 検索結果をパネル順にグループ化
  const grouped = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    let count = 0;

    const groups: { panel: PanelId; entries: MemoEntry[] }[] = [];

    for (const panelId of order) {
      if (count >= MAX_RESULTS) break;
      const matched: MemoEntry[] = [];
      for (const e of entries) {
        if (count >= MAX_RESULTS) break;
        if (e.panel !== panelId) continue;
        if (e.type === 'image') continue;
        if (e.content.toLowerCase().includes(q)) {
          matched.push(e);
          count++;
        }
      }
      if (matched.length > 0) {
        groups.push({ panel: panelId, entries: matched });
      }
    }

    return groups;
  }, [debouncedQuery, entries, order]);

  const totalCount = useMemo(
    () => grouped.reduce((sum, g) => sum + g.entries.length, 0),
    [grouped],
  );

  // 結果クリック → エントリにスクロール＆ハイライト
  const handleSelect = useCallback(
    (entry: MemoEntry) => {
      close();
      navigateToEntry(entry.id, entry.panel, setActivePanel);
    },
    [close, setActivePanel],
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

      {/* 検索パレット */}
      <div
        className="fixed z-[60] flex flex-col"
        style={{
          top: 'var(--header-h)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(520px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - var(--header-h) - 24px)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 32px var(--shadow-menu)',
          animation: 'search-in 0.15s ease-out',
        }}
      >
        {/* 入力欄 */}
        <div className="border-border-subtle flex items-center gap-2 border-b px-3 py-2">
          <Search size={15} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="エントリを検索…"
            autoComplete="off"
            className="text-text-primary placeholder:text-text-faint flex-1 border-none bg-transparent text-sm outline-none"
            style={{ boxShadow: 'none' }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-text-muted hover:text-text-primary flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0.5 transition-colors duration-100"
              aria-label="クリア"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 結果エリア */}
        <div className="overflow-y-auto" style={{ maxHeight: 'min(60vh, 480px)' }}>
          {debouncedQuery && totalCount === 0 && (
            <div className="text-text-muted px-3 py-6 text-center text-sm">
              該当するエントリが見つかりません
            </div>
          )}

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
                <span className="text-text-muted ml-1 font-normal">{group.entries.length}件</span>
              </div>

              {/* エントリ一覧 */}
              {group.entries.map((entry) => (
                <SearchResultItem
                  key={entry.id}
                  entry={entry}
                  query={debouncedQuery}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ))}
        </div>

        {/* フッター: 結果カウント */}
        {debouncedQuery && totalCount > 0 && (
          <div className="text-text-muted border-border-subtle border-t px-3 py-1.5 text-[11px]">
            {totalCount}件の結果
            {totalCount >= MAX_RESULTS && '（上限）'}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
