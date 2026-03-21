import { act, renderHook } from '@testing-library/react';
import { useGroupSwap } from '../useGroupSwap';

describe('useGroupSwap', () => {
  const reorder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const groups = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('下方向に入れ替える', () => {
    const { result } = renderHook(() => useGroupSwap(groups, reorder));
    act(() => result.current(0, 1));
    expect(reorder).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('上方向に入れ替える', () => {
    const { result } = renderHook(() => useGroupSwap(groups, reorder));
    act(() => result.current(1, -1));
    expect(reorder).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('先頭要素の上方向は reorder を呼ばない', () => {
    const { result } = renderHook(() => useGroupSwap(groups, reorder));
    act(() => result.current(0, -1));
    expect(reorder).not.toHaveBeenCalled();
  });

  it('末尾要素の下方向は reorder を呼ばない', () => {
    const { result } = renderHook(() => useGroupSwap(groups, reorder));
    act(() => result.current(2, 1));
    expect(reorder).not.toHaveBeenCalled();
  });
});
