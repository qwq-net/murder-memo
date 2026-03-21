import { renderHook } from '@testing-library/react';
import { useAutoResizeTextarea } from '../useAutoResizeTextarea';

function mockTextarea(scrollHeight: number): HTMLTextAreaElement {
  return {
    scrollHeight,
    style: { height: '', overflowY: '' },
  } as unknown as HTMLTextAreaElement;
}

describe('useAutoResizeTextarea', () => {
  it('scrollHeight に合わせて高さを設定する', () => {
    const { result } = renderHook(() => useAutoResizeTextarea());
    const el = mockTextarea(100);
    result.current.resize(el);
    expect(el.style.height).toBe('100px');
  });

  it('maxHeight を超える場合は maxHeight にクランプする', () => {
    const { result } = renderHook(() => useAutoResizeTextarea(80));
    const el = mockTextarea(100);
    result.current.resize(el);
    expect(el.style.height).toBe('80px');
    expect(el.style.overflowY).toBe('auto');
  });

  it('maxHeight 以下の場合は overflowY=hidden', () => {
    const { result } = renderHook(() => useAutoResizeTextarea(120));
    const el = mockTextarea(100);
    result.current.resize(el);
    expect(el.style.height).toBe('100px');
    expect(el.style.overflowY).toBe('hidden');
  });

  it('null を渡してもクラッシュしない', () => {
    const { result } = renderHook(() => useAutoResizeTextarea());
    expect(() => result.current.resize(null)).not.toThrow();
  });
});
