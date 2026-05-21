import type { ReactNode } from 'react';

interface SubFeatureProps {
  /** 副機能の見出し (h3) */
  title: string;
  /** 内容 */
  children: ReactNode;
}

/**
 * Guide のセクション内に並べる副機能 1 つ分の枠。
 *
 * - h3 見出し + 説明 / プレビュー / 表など自由配置
 * - Section ほど強くは区切らない（罫線なし、間隔のみ）
 */
export function SubFeature({ title, children }: SubFeatureProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
