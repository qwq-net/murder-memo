import { act, renderHook } from '@testing-library/react';
import { useDeleteWithConfirmation } from '../useDeleteWithConfirmation';

describe('useDeleteWithConfirmation', () => {
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hasItems=true の場合、requestDelete でモーダルが開く', () => {
    const { result } = renderHook(() => useDeleteWithConfirmation(true, onDelete));
    act(() => result.current.requestDelete());

    expect(result.current.isModalOpen).toBe(true);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('hasItems=false の場合、requestDelete で即 onDelete が呼ばれる', () => {
    const { result } = renderHook(() => useDeleteWithConfirmation(false, onDelete));
    act(() => result.current.requestDelete());

    expect(result.current.isModalOpen).toBe(false);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('closeModal でモーダルが閉じる', () => {
    const { result } = renderHook(() => useDeleteWithConfirmation(true, onDelete));
    act(() => result.current.requestDelete());
    expect(result.current.isModalOpen).toBe(true);

    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });
});
