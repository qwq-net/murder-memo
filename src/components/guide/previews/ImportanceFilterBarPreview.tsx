import { useState } from 'react';

import { ImportanceFilterBarView } from '@/components/entries/importanceFilterBarView';
import type { ImportanceLevel } from '@/types/memo';

/**
 * パネルヘッダー右側に表示される、重要度絞り込みバーのプレビュー。
 *
 * 本物の `ImportanceFilterBarView` をそのまま使い、セグメントのトグル / × クリアの操作を
 * ローカル state で再現する。フィルタの結果（エントリが絞り込まれる挙動）は本体のパネルでのみ
 * 機能するため、ここでは「バー」の見た目と操作だけを示す。
 */
export function ImportanceFilterBarPreview() {
  const [activeLevels, setActiveLevels] = useState<ImportanceLevel[]>(['high']);

  const toggle = (level: ImportanceLevel) => {
    setActiveLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };
  const clear = () => setActiveLevels([]);

  // 本体と同じく、ヘッダー想定のコンテナでラップして雰囲気を出す
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
        自分用メモ
      </span>
      <ImportanceFilterBarView activeLevels={activeLevels} onToggle={toggle} onClear={clear} />
    </div>
  );
}
