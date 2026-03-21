import { renderHook } from '@testing-library/react';
import { useEscapeKey } from '../useEscapeKey';

function pressEscape() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
}

function pressEnter() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
}

describe('useEscapeKey', () => {
  it('Escape キーで callback が呼ばれる', () => {
    const cb = vi.fn();
    renderHook(() => useEscapeKey(cb));
    pressEscape();
    expect(cb).toHaveBeenCalledOnce();
  });

  it('他のキーでは callback は呼ばれない', () => {
    const cb = vi.fn();
    renderHook(() => useEscapeKey(cb));
    pressEnter();
    expect(cb).not.toHaveBeenCalled();
  });

  it('enabled=false の場合は無視される', () => {
    const cb = vi.fn();
    renderHook(() => useEscapeKey(cb, false));
    pressEscape();
    expect(cb).not.toHaveBeenCalled();
  });

  it('アンマウント後はリスナーが解除される', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(cb));
    unmount();
    pressEscape();
    expect(cb).not.toHaveBeenCalled();
  });
});
