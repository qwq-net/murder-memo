/**
 * sortOrder（表示順）に関する共通ユーティリティ。
 * 各スライスで手書き反復していた「末尾追加の採番」「昇順比較」「並び替えの再採番」を集約する。
 */

/** sortOrder 昇順の比較関数 */
export const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }): number =>
  a.sortOrder - b.sortOrder;

/** 末尾追加用の次の sortOrder（空なら 0）。既存の reduce(..., -1) + 1 と同値 */
export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1;
}

/**
 * orderedIds の並び位置で sortOrder を再採番する。
 * - orderedIds に含まれない要素・sortOrder が変わらない要素は同一参照のまま（changed に含めない）
 * - updated は元の配列位置を維持して返す（並べ替えは呼び手の責務。state へ反映する際の
 *   sort 有無がスライスごとに異なるため）
 */
export function applyReorder<T extends { id: string; sortOrder: number }>(
  items: readonly T[],
  orderedIds: readonly string[],
): { updated: T[]; changed: T[] } {
  const indexById = new Map(orderedIds.map((id, i) => [id, i]));
  const changed: T[] = [];
  const updated = items.map((item) => {
    const idx = indexById.get(item.id);
    if (idx === undefined || item.sortOrder === idx) return item;
    const next = { ...item, sortOrder: idx };
    changed.push(next);
    return next;
  });
  return { updated, changed };
}
