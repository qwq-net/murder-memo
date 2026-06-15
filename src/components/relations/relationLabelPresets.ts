/**
 * 相関図の関係ラベル用プリセット定義。
 *
 * 関係性のテンプレートと、それぞれに紐付くデフォルト色を持つ。
 * `RelationListView`（編集 UI）と Guide のプレビューの両方から参照される。
 *
 * 値の追加 / 順序変更時は両方の見た目が変わる点に注意。
 *
 * ラベルの表示文字列は i18n カタログ（relations.presets.*）から解決する。
 * ここでは i18n キーと色だけを保持し、表示テキストの解決は呼び出し側の責務。
 */

import type { TFunc } from '@/i18n';
import type { MessageKey } from '@/lib/i18n';

export interface RelationLabelPresetDef {
  /** i18n カタログの `relations.presets.*` キー */
  key: MessageKey;
  color: string;
}

/**
 * プリセット定義（表示ラベルは呼び出し側で `t(def.key)` により解決する）。
 * `key` は `relations.presets.*` に対応する。
 */
export const RELATION_LABEL_PRESET_DEFS: RelationLabelPresetDef[] = [
  { key: 'relations.presets.friend', color: '#3498db' },
  { key: 'relations.presets.lover', color: '#e91e8c' },
  { key: 'relations.presets.family', color: '#2ecc71' },
  { key: 'relations.presets.boss', color: '#8e44ad' },
  { key: 'relations.presets.enemy', color: '#e74c3c' },
  { key: 'relations.presets.ally', color: '#27ae60' },
  { key: 'relations.presets.acquaintance', color: '#95a5a6' },
  { key: 'relations.presets.unknown', color: '#7f8c8d' },
];

/**
 * 解決済みプリセット（label が表示文字列として確定済みのもの）。
 * `useRelationLabelPresets` で生成し消費側に渡す。
 */
export interface RelationLabelPreset {
  label: string;
  color: string;
}

/**
 * t 関数を受け取り、現在の言語でラベルを解決したプリセット配列を返す純関数。
 * `RelationListView` のレンダー内で呼び出す（`useMemo` で t の変化に追従させる）。
 */
export function resolveRelationLabelPresets(t: TFunc): RelationLabelPreset[] {
  return RELATION_LABEL_PRESET_DEFS.map((def) => ({ label: t(def.key), color: def.color }));
}

/**
 * プリセットラベル名でデフォルト色を取得するヘルパー。
 * 解決済みプリセット配列を受け取り、label 名（表示文字列）で検索する。
 */
export function getRelationPresetColor(
  label: string,
  presets: RelationLabelPreset[],
): string | undefined {
  return presets.find((p) => p.label === label)?.color;
}

/** 日本語ラベルの静的マップ（key → 日本語テキスト）。後方互換エクスポート用。 */
const PRESET_JA_LABELS: Record<string, string> = {
  'relations.presets.friend': '友人',
  'relations.presets.lover': '恋人',
  'relations.presets.family': '家族',
  'relations.presets.boss': '上司部下',
  'relations.presets.enemy': '敵対',
  'relations.presets.ally': '協力者',
  'relations.presets.acquaintance': '知人',
  'relations.presets.unknown': '不明',
};

/**
 * 後方互換エクスポート。
 * ガイドプレビュー（`RelationPresetChipsPreview`）等、relations フォルダ外から
 * `RELATION_LABEL_PRESETS` を参照しているコンポーネントが存在するため残す。
 * 表示ラベルは日本語固定（i18n 未対応）。
 * relations フォルダ外のコンポーネントを移行する際は `RELATION_LABEL_PRESET_DEFS` と
 * `resolveRelationLabelPresets(t)` に切り替えること。
 *
 * @deprecated `resolveRelationLabelPresets(t)` を使用してください。
 */
export const RELATION_LABEL_PRESETS: RelationLabelPreset[] = RELATION_LABEL_PRESET_DEFS.map(
  (def) => ({ label: PRESET_JA_LABELS[def.key] ?? def.key, color: def.color }),
);
