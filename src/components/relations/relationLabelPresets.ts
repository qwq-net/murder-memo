/**
 * 相関図の関係ラベル用プリセット定義。
 *
 * 関係性のテンプレートと、それぞれに紐付くデフォルト色を持つ。
 * `RelationListView`（編集 UI）と Guide のプレビューの両方から参照される。
 *
 * 値の追加 / 順序変更時は両方の見た目が変わる点に注意。
 */

export interface RelationLabelPreset {
  label: string;
  color: string;
}

export const RELATION_LABEL_PRESETS: RelationLabelPreset[] = [
  { label: '友人', color: '#3498db' },
  { label: '恋人', color: '#e91e8c' },
  { label: '家族', color: '#2ecc71' },
  { label: '上司部下', color: '#8e44ad' },
  { label: '敵対', color: '#e74c3c' },
  { label: '協力者', color: '#27ae60' },
  { label: '知人', color: '#95a5a6' },
  { label: '不明', color: '#7f8c8d' },
];

/** プリセットからラベル名でデフォルト色を取得 */
export function getRelationPresetColor(label: string): string | undefined {
  return RELATION_LABEL_PRESETS.find((p) => p.label === label)?.color;
}
