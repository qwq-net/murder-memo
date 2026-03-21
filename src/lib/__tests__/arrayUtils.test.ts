import { swapAdjacent } from '../arrayUtils';

describe('swapAdjacent', () => {
  it('下方向に入れ替える', () => {
    expect(swapAdjacent(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('上方向に入れ替える', () => {
    expect(swapAdjacent(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
  });

  it('末尾要素の下方向は変更なし', () => {
    expect(swapAdjacent(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });

  it('先頭要素の上方向は変更なし', () => {
    expect(swapAdjacent(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });

  it('要素1個の配列は変更なし', () => {
    expect(swapAdjacent(['a'], 0, 1)).toEqual(['a']);
    expect(swapAdjacent(['a'], 0, -1)).toEqual(['a']);
  });

  it('元の配列を変更しない', () => {
    const original = ['a', 'b', 'c'];
    swapAdjacent(original, 0, 1);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});
