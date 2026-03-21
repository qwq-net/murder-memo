/**
 * 配列内の隣接要素を入れ替える。
 * 範囲外の場合は元の配列のコピーをそのまま返す。
 */
export function swapAdjacent<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const result = [...items];
  const target = index + direction;
  if (target < 0 || target >= result.length) return result;
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
