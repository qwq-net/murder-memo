interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  /** 現在のスクロール位置に対応する active 項目の ID（指定するとハイライト表示する） */
  activeId?: string | null;
}

/**
 * Guide ページの目次。
 *
 * - h2 のアンカー ID へのリンクを縦並びで列挙する
 * - 装飾は控えめ、サイドに sticky 配置することを想定したコンパクトな表示
 * - クリックでアンカースクロール（`html { scroll-behavior: smooth }` で滑らかに動く）
 * - `activeId` が渡されたら該当項目をアクセント色 + 左縦ラインでハイライトする
 */
export function TableOfContents({ items, activeId }: TableOfContentsProps) {
  return (
    <nav
      aria-label="目次"
      style={{
        padding: '12px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        このページの目次
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  padding: '4px 6px 4px 9px',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'transparent',
                  lineHeight: 1.4,
                  transition: 'color 0.12s, background 0.12s, border-color 0.12s',
                }}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
