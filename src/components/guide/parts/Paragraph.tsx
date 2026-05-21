import type { ReactNode } from 'react';

/**
 * Guide 本文の段落。
 * `<p>` を読みやすい行間 / 色で出す共通スタイル。
 */
export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.9,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
