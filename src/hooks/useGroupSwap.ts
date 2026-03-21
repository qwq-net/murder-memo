import { useCallback } from 'react';

import { swapAdjacent } from '@/lib/arrayUtils';

/**
 * グループの隣接入れ替えを共通化するフック。
 * MemoPanel と TimelinePanel で利用。
 */
export function useGroupSwap<T extends { id: string }>(
  groups: T[],
  reorder: (ids: string[]) => void,
): (index: number, direction: -1 | 1) => void {
  return useCallback(
    (index: number, direction: -1 | 1) => {
      const ids = groups.map((g) => g.id);
      const swapped = swapAdjacent(ids, index, direction);
      // 範囲外の場合は swapAdjacent が同じ配列を返すが、
      // 実際に入れ替わったかチェックして無駄な呼び出しを回避
      if (swapped[index] !== ids[index]) {
        reorder(swapped);
      }
    },
    [groups, reorder],
  );
}
