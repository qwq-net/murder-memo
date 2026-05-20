import type { ReactNode } from 'react';

interface SectionProps {
  /** セクション h2 用の見出し */
  title: string;
  /** ヘッダー右上の小さい補足（例: 「ショートカット」など）。省略可 */
  caption?: string;
  /** 本文。テキスト・プレビュー・リストなど自由配置 */
  children: ReactNode;
  /** スクロール時のアンカー / TOC リンク用 ID */
  id?: string;
}

/**
 * Guide の各セクションの共通枠。
 *
 * - h2 見出し + 任意 caption + コンテンツの 3 部構成
 * - 上下に余白を取り、長文ページとして読みやすい行間 / 幅にする
 * - 装飾は最小限（罫線のみ）。煽り見出しや eyebrow は使わない
 */
export function Section({ title, caption, children, id }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        padding: '40px 0',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </h2>
        {caption ? (
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-faint)',
              letterSpacing: '0.06em',
            }}
          >
            {caption}
          </span>
        ) : null}
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </section>
  );
}
