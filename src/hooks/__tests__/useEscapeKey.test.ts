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

  // 回帰防止 (#39): モーダルが重なっても 1 回の Escape で最前面の 1 つだけが閉じる
  it('複数登録時は最後に登録した（最前面の）ハンドラだけが呼ばれる', () => {
    const lower = vi.fn();
    const upper = vi.fn();
    const h1 = renderHook(() => useEscapeKey(lower));
    const h2 = renderHook(() => useEscapeKey(upper));

    pressEscape();
    expect(upper).toHaveBeenCalledOnce();
    expect(lower).not.toHaveBeenCalled();

    // 最前面を閉じると、次の Escape は下の層に届く
    h2.unmount();
    pressEscape();
    expect(lower).toHaveBeenCalledOnce();

    h1.unmount();
  });
});
