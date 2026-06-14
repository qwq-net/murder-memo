import { describe, expect, it } from 'vitest';

import { applyReorder, bySortOrder, nextSortOrder } from '../sortOrder';

describe('nextSortOrder', () => {
  it('空配列なら 0 を返す（既存の reduce(-1)+1 と同値）', () => {
    expect(nextSortOrder([])).toBe(0);
  });
  it('最大 sortOrder + 1 を返す', () => {
    expect(nextSortOrder([{ sortOrder: 2 }, { sortOrder: 5 }, { sortOrder: 1 }])).toBe(6);
  });
});

describe('bySortOrder', () => {
  it('sortOrder 昇順に並ぶ', () => {
    const xs = [{ sortOrder: 3 }, { sortOrder: 1 }, { sortOrder: 2 }];
    expect([...xs].sort(bySortOrder).map((x) => x.sortOrder)).toEqual([1, 2, 3]);
  });
});

describe('applyReorder', () => {
  const items = [
    { id: 'a', sortOrder: 0 },
    { id: 'b', sortOrder: 1 },
    { id: 'c', sortOrder: 2 },
  ];
  it('orderedIds の位置で sortOrder を再採番し、変化分だけ changed に集める', () => {
    const { updated, changed } = applyReorder(items, ['c', 'a', 'b']);
    expect(updated.map((x) => x.id)).toEqual(['a', 'b', 'c']); // 位置は元のまま
    expect(updated.map((x) => x.sortOrder)).toEqual([1, 2, 0]);
    expect(changed.map((x) => x.id).sort()).toEqual(['a', 'b', 'c']);
  });
  it('orderedIds に無い要素と sortOrder が変わらない要素は同一参照のまま', () => {
    const { updated, changed } = applyReorder(items, ['a', 'b']);
    expect(updated[0]).toBe(items[0]);
    expect(updated[1]).toBe(items[1]);
    expect(updated[2]).toBe(items[2]);
    expect(changed).toEqual([]);
  });
});
