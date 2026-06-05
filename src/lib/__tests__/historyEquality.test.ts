import { groupsEqualIgnoringCollapse } from '../historyEquality';

describe('groupsEqualIgnoringCollapse', () => {
  it('同一参照は true', () => {
    const a = [{ id: 'g1', label: 'A', collapsed: false }];
    expect(groupsEqualIgnoringCollapse(a, a)).toBe(true);
  });

  it('collapsed だけが違う場合は true（折りたたみは履歴に積まない）', () => {
    const a = [{ id: 'g1', label: 'A', sortOrder: 0, collapsed: false }];
    const b = [{ id: 'g1', label: 'A', sortOrder: 0, collapsed: true }];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(true);
  });

  it('label が違えば false（データ変更は検出する）', () => {
    const a = [{ id: 'g1', label: 'A', collapsed: false }];
    const b = [{ id: 'g1', label: 'B', collapsed: false }];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(false);
  });

  it('sortOrder が違えば false（並び替えは検出する）', () => {
    const a = [{ id: 'g1', label: 'A', sortOrder: 0, collapsed: true }];
    const b = [{ id: 'g1', label: 'A', sortOrder: 1, collapsed: false }];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(false);
  });

  it('要素数が違えば false（追加・削除を検出する）', () => {
    const a = [{ id: 'g1', collapsed: false }];
    const b = [
      { id: 'g1', collapsed: false },
      { id: 'g2', collapsed: false },
    ];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(false);
  });

  it('id が違えば false', () => {
    const a = [{ id: 'g1', collapsed: false }];
    const b = [{ id: 'g2', collapsed: false }];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(false);
  });

  it('空配列同士は true', () => {
    expect(groupsEqualIgnoringCollapse([], [])).toBe(true);
  });

  it('collapsed 未定義と false の差は無視されない方の他フィールドで判定（collapsed のみ差なら true）', () => {
    const a = [{ id: 'g1', label: 'A' }];
    const b = [{ id: 'g1', label: 'A', collapsed: true }];
    expect(groupsEqualIgnoringCollapse(a, b)).toBe(true);
  });
});
