import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

const TEST_KEY = 'test-key';

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalStorage', () => {
  it('localStorage に値がない場合はデフォルト値を返す', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('localStorage に値がある場合はその値を返す', () => {
    localStorage.setItem(TEST_KEY, 'stored');
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('setValue で state と localStorage が更新される', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem(TEST_KEY)).toBe('new-value');
  });

  it('localStorage が例外を投げてもフォールバックする', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'fallback'));
    expect(result.current[0]).toBe('fallback');
    getItemSpy.mockRestore();
  });

  it('setItem が例外を投げてもクラッシュしない', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default'));
    act(() => {
      result.current[1]('value');
    });
    // state は更新される（localStorage は失敗）
    expect(result.current[0]).toBe('value');
    setItemSpy.mockRestore();
  });
});
