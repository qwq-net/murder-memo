interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

/**
 * Guide ページ冒頭の目次。
 *
 * - h2 のアンカー ID へのリンクを横並びチップで列挙する
 * - 装飾は控えめ、モバイル幅では自然に折り返す
 * - クリックでアンカースクロール（ブラウザのデフォルト挙動を利用）
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav
      aria-label="目次"
      style={{
        marginTop: 16,
        padding: '12px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-faint)',
          letterSpacing: '0.08em',
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
          flexWrap: 'wrap',
          gap: '4px 12px',
        }}
      >
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
