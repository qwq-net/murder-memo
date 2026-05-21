import type { ReactNode } from 'react';

/**
 * Guide 本文中で `[キーワード]` 等の記法を見せるための小さな code 表示。
 */
export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        background: 'var(--bg-elevated)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </code>
  );
}
