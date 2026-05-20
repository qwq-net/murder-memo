import { act, renderHook } from '@testing-library/react';
import { useTimeInput } from '../useTimeInput';

describe('useTimeInput', () => {
  it('handleChange で全角数字・全角コロンが半角に正規化される', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleChange('１３：００'));
    expect(result.current.timeValue).toBe('13:00');
  });

  it('handleChange はエラー状態をクリアする', () => {
    const { result } = renderHook(() => useTimeInput());
    // 一旦エラーを立てる
    act(() => result.current.setTimeError(true));
    expect(result.current.timeError).toBe(true);
    // ユーザーが入力し直したらエラー解除されるべき
    act(() => result.current.handleChange('12'));
    expect(result.current.timeError).toBe(false);
  });

  it('handleBlur で数字のみ入力を HH:MM に補完する', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleChange('1300'));
    expect(result.current.timeValue).toBe('1300');
    act(() => result.current.handleBlur());
    expect(result.current.timeValue).toBe('13:00');
  });

  it('handleBlur は既にコロン入りの値を変更しない', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleChange('9:30'));
    act(() => result.current.handleBlur());
    expect(result.current.timeValue).toBe('9:30');
  });

  it('handleBlur は空文字を変更しない（不要な変換を行わない）', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleBlur());
    expect(result.current.timeValue).toBe('');
  });

  it('reset で値とエラーが初期状態に戻る', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleChange('14:30'));
    act(() => result.current.setTimeError(true));
    act(() => result.current.reset());
    expect(result.current.timeValue).toBe('');
    expect(result.current.timeError).toBe(false);
  });

  it('getCompleted は現在値を変更せずに補完後の文字列を返す', () => {
    const { result } = renderHook(() => useTimeInput());
    act(() => result.current.handleChange('930'));
    // getCompleted は state に反映しないことを保証
    expect(result.current.getCompleted()).toBe('9:30');
    expect(result.current.timeValue).toBe('930');
  });
});
