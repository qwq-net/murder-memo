import type { ReactNode } from 'react';

import { InlineCode } from '@/components/guide/parts/InlineCode';

export interface KeyValueRow {
  /** 左列の見出し（キー / ショートカット / 操作名など） */
  key: string;
  /** 右列の説明 */
  value: ReactNode;
  /** 左列を `<InlineCode>` で囲む（ショートカット表示用）。default: false */
  keyAsCode?: boolean;
}

interface KeyValueTableProps {
  rows: KeyValueRow[];
}

/**
 * Guide で操作一覧 / ショートカット / 設定項目を見せる 2 列表。
 *
 * - 左列: auto 幅、右列: 残り
 * - `display: contents` を使って flat な grid に整える
 * - `keyAsCode` を true にすると左列を `<InlineCode>` で囲む
 */
export function KeyValueTable({ rows }: KeyValueTableProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 16,
        rowGap: 6,
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.8,
      }}
    >
      {rows.map(({ key, value, keyAsCode }) => (
        <div key={key} style={{ display: 'contents' }}>
          {keyAsCode ? <InlineCode>{key}</InlineCode> : <span>{key}</span>}
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}
