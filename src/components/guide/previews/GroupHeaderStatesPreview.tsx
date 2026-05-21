import { useState } from 'react';

import { GroupHeaderView } from '@/components/common/groupHeaderView';
import { StateLabel } from '@/components/guide/parts/StateLabel';

interface Variant {
  label: string;
  collapsed: boolean;
  isEditing: boolean;
  forceHover?: boolean;
}

const VARIANTS: Variant[] = [
  { label: '展開済み', collapsed: false, isEditing: false },
  { label: '折りたたみ済み', collapsed: true, isEditing: false },
  { label: 'ホバー時（操作ボタン表示）', collapsed: false, isEditing: false, forceHover: true },
  { label: '名前を編集中', collapsed: false, isEditing: true },
];

const ACCENT = 'var(--panel-free-accent)';

/**
 * グループヘッダーの 3 つの状態（展開 / 折りたたみ / 編集）を並べるプレビュー。
 *
 * 本物の `GroupHeaderView` をそのまま使うため、矢印やラベルの色・編集中の input 装飾が
 * `/app` と完全に同じ。編集中の下書きは内部 state で受けるが、確定時は何も保存しない。
 *
 * ホバー時に出る移動 / 編集 / 削除ボタンは、実際にマウスを乗せると `/app` と同じ挙動で表示される。
 */
export function GroupHeaderStatesPreview() {
  const [draft, setDraft] = useState('気になるポイント');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {VARIANTS.map((v) => (
        <div key={v.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StateLabel>{v.label}</StateLabel>
          <GroupHeaderView
            label="気になるポイント"
            collapsed={v.collapsed}
            accentColor={ACCENT}
            onToggle={() => undefined}
            isEditing={v.isEditing}
            draftLabel={draft}
            onDraftChange={setDraft}
            onSave={() => undefined}
            onStartEditing={() => undefined}
            onLabelKeyDown={() => undefined}
            onMoveUp={() => undefined}
            onMoveDown={() => undefined}
            onRequestDelete={() => undefined}
            forceHover={v.forceHover}
            autoFocusInput={false}
          />
        </div>
      ))}
    </div>
  );
}
