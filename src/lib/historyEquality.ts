/**
 * Undo/Redo（zundo）の履歴等価判定で使うヘルパー。
 *
 * 折りたたみ状態（collapsed）のような UI 寄りの状態変化で Undo 履歴が積まれるのを防ぐため、
 * partialize した TrackedState の比較ロジックをここに切り出してテスト可能にしている。
 */

/** 折りたたみ可能なグループの最小形（timelineGroups / memoGroups 要素を想定）。 */
interface CollapsibleGroup {
  id: string;
  collapsed?: boolean;
}

/**
 * グループ配列が「折りたたみ状態（collapsed）を無視して」同一かを判定する。
 *
 * - 同一参照なら true（高速パス。データ未変更時はここで抜ける）
 * - 長さが異なれば false（グループの追加・削除を「変更あり」とみなす）
 * - 各要素について collapsed 以外のフィールドが1つでも異なれば false
 *   （label 変更・sortOrder 変更＝並び替え・id 変更などを検出する）
 * - collapsed だけが異なる場合は true（折りたたみトグルは履歴に積まない）
 *
 * 並び順が同じであることを前提とする（store の各アクションは map で順序を保つ）。
 * 使われ方: store/index.ts の zundo `equality` から timelineGroups / memoGroups の比較に使う。
 */
export function groupsEqualIgnoringCollapse(
  a: CollapsibleGroup[],
  b: CollapsibleGroup[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] as unknown as Record<string, unknown>;
    const y = b[i] as unknown as Record<string, unknown>;
    if (x === y) continue;
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of keys) {
      if (k === 'collapsed') continue;
      if (x[k] !== y[k]) return false;
    }
  }
  return true;
}
