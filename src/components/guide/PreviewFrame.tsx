import type { ReactNode } from 'react';

interface PreviewFrameProps {
  /** プレビューの内容（実コンポーネント / モック） */
  children: ReactNode;
  /** 「これはプレビューです」を伝える小さいラベル。省略時は「プレビュー」 */
  label?: string;
}

/**
 * Guide 内に「動くプレビュー」を埋め込むための共通枠。
 *
 * - パネルを模した薄い背景 + 罫線で「ここはアプリ本体ではなくサンプル」と伝える
 * - 上端に小さい「プレビュー」ラベルを置き、本文と視覚的に区別する
 * - 中身（children）は実コンポーネントの `*View` でも、軽量モックでも可
 */
export function PreviewFrame({ children, label = 'プレビュー' }: PreviewFrameProps) {
  return (
    <figure
      style={{
        margin: 0,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <figcaption
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-faint)',
          letterSpacing: '0.08em',
          background: 'var(--bg-base)',
        }}
      >
        {label}
      </figcaption>
      <div style={{ padding: 16 }}>{children}</div>
    </figure>
  );
}
