/**
 * Guide 本文の簡素な箇条書き。
 * 黒い点 + テキストの 1 列リスト。
 */
export function SubList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            position: 'relative',
            paddingLeft: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: '0.75em',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--text-faint)',
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
