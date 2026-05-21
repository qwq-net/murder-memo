import { useState } from 'react';

import { CharacterFilterBarView } from '@/components/characters/characterFilterBarView';
import { GUIDE_SAMPLE_CHARACTERS } from '@/components/guide/previews/sampleData';
import { sortCharactersByRole } from '@/lib/characterSort';

const VISIBLE = sortCharactersByRole(GUIDE_SAMPLE_CHARACTERS.filter((c) => c.showInEntries));

/**
 * パネルヘッダー右側に表示される、キャラクター絞り込みバーのプレビュー。
 *
 * 本物の `CharacterFilterBarView` をそのまま使い、バッジクリックでトグル / × でクリアできる
 * インタラクションをローカル state で再現する。フィルタの結果（エントリが絞り込まれる挙動）は
 * 本体のパネルでのみ機能するため、ここでは「バー」の見た目と操作だけを示す。
 */
export function CharacterFilterBarPreview() {
  const [filterIds, setFilterIds] = useState<string[]>(['pl-businessman']);

  const toggle = (id: string) => {
    setFilterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const clear = () => setFilterIds([]);

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
      <CharacterFilterBarView
        characters={VISIBLE}
        filterIds={filterIds}
        onToggle={toggle}
        onClear={clear}
      />
    </div>
  );
}
