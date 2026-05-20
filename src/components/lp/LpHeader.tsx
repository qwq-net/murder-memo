import { Link } from 'react-router-dom';

/**
 * LP / Guide 共通の上部ヘッダー。
 *
 * サイズ感は `/app`（AppShell）のヘッダーと統一する:
 *   - 高さ `--header-h`（44px）
 *   - `bg-bg-surface` + `border-b border-border-subtle`
 *   - 水平パディング `px-[14px]`
 *   - ロゴ 20×20、サイト名は `text-sm font-semibold tracking-[0.08em]`
 *
 * 違いは右側のナビ内容のみ（`/app` は機能ボタン、LP は使い方 / アプリを開く）。
 * スクロール追従が欲しいので、LP 側だけ sticky を付与する。
 */
export function LpHeader() {
  return (
    <header className="bg-bg-surface border-border-subtle sticky top-0 z-20 flex shrink-0 flex-col border-b">
      <div
        className="flex items-center justify-between px-[14px]"
        style={{ height: 'var(--header-h)' }}
      >
        {/* Logo / title */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img src="/logo.svg" alt="" width="20" height="20" />
          <span className="text-text-primary text-sm font-semibold tracking-[0.08em]">
            マダめもくん
          </span>
        </Link>

        {/* ナビ（LP 専用: 使い方 / アプリを開く） */}
        <nav className="flex items-center gap-2">
          <Link to="/guide" className="btn-ghost btn-sm">
            使い方
          </Link>
          <Link to="/app" className="btn-primary btn-sm">
            アプリを開く
          </Link>
        </nav>
      </div>
    </header>
  );
}
