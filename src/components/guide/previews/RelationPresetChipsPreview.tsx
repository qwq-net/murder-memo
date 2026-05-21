import { RELATION_LABEL_PRESETS } from '@/components/relations/relationLabelPresets';

/**
 * 相関図のラベルプリセット一覧をチップ形式で並べるプレビュー。
 *
 * 本体（`RelationListView`）と同じ `RELATION_LABEL_PRESETS` を直接参照するため、
 * ラベルや色を本体側で追加・変更すれば Guide にも自動で反映される。
 *
 * チップのスタイルは本体の編集 UI（`RelationListView` 内のプリセットボタン）と同じ
 * 「左に色丸 + ラベル」の構成にしてある。
 */
export function RelationPresetChipsPreview() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {RELATION_LABEL_PRESETS.map((preset) => (
        <span
          key={preset.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: preset.color,
              flexShrink: 0,
            }}
          />
          {preset.label}
        </span>
      ))}
    </div>
  );
}
