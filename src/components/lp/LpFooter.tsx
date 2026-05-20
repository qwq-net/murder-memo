/**
 * LP / Guide のフッター。
 *
 * `/app`（AppShell）のフッターと同じ仕様で揃える:
 *   - border-top + bg-surface
 *   - 中央寄せ
 *   - 小さなコピーライト1行のみ（リンクなど追加情報は置かない）
 */
export function LpFooter() {
  return (
    <footer className="border-border-subtle bg-bg-surface flex shrink-0 items-center justify-center border-t px-[14px] py-1.5">
      <span className="text-text-faint text-sm tracking-[0.04em]">&copy; 2026 マダめもくん</span>
    </footer>
  );
}
