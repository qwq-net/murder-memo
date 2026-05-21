import { type ReactNode, type Ref } from 'react';

import { Search, X } from '@/components/icons';

interface SearchOverlayShellViewProps {
  /** 検索入力値 */
  query: string;
  /** 入力変更ハンドラ */
  onQueryChange: (next: string) => void;
  /** 入力欄の ref（親で focus 制御したいときに渡す） */
  inputRef?: Ref<HTMLInputElement>;
  /** 表示するヒット件数。フッターの「N件の結果」表示に使う。未指定ならフッターを出さない */
  totalCount?: number;
  /** 上限に達したか（フッターに「（上限）」表記を追加する） */
  maxReached?: boolean;
  /** 「該当なし」のメッセージを出すべきか（呼び出し側で「query があるのに結果 0 件」等を判定） */
  showEmpty?: boolean;
  /** 結果領域に流し込む内容（呼び出し側でグループ + 行を構築） */
  children: ReactNode;
}

/**
 * 検索パレットの外枠（入力欄 + 結果領域 + フッター）の純粋表示版。
 *
 * - `useStore` / portal / フォーカス管理は持たない（呼び出し側の `SearchOverlay` が担当）
 * - パレットの位置・装飾は本体と同じ。Guide でもそのまま使える
 * - children に結果のグループや行を流し込む
 */
export function SearchOverlayShellView({
  query,
  onQueryChange,
  inputRef,
  totalCount,
  maxReached,
  showEmpty,
  children,
}: SearchOverlayShellViewProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: 'min(520px, calc(100vw - 24px))',
        maxHeight: 'calc(100vh - var(--header-h) - 24px)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 32px var(--shadow-menu)',
      }}
    >
      {/* 入力欄 */}
      <div className="border-border-subtle flex items-center gap-2 border-b px-3 py-2">
        <Search size={15} className="text-text-muted shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="エントリを検索…"
          autoComplete="off"
          className="text-text-primary placeholder:text-text-faint flex-1 border-none bg-transparent text-sm outline-none"
          style={{ boxShadow: 'none' }}
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="text-text-muted hover:text-text-primary flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0.5 transition-colors duration-100"
            aria-label="クリア"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 結果エリア */}
      <div className="overflow-y-auto" style={{ maxHeight: 'min(60vh, 480px)' }}>
        {showEmpty && (
          <div className="text-text-muted px-3 py-6 text-center text-sm">
            該当するエントリが見つかりません
          </div>
        )}
        {children}
      </div>

      {/* フッター: 結果カウント */}
      {totalCount !== undefined && totalCount > 0 && (
        <div className="text-text-muted border-border-subtle border-t px-3 py-1.5 text-[11px]">
          {totalCount}件の結果{maxReached && '（上限）'}
        </div>
      )}
    </div>
  );
}
