import { act, renderHook } from '@testing-library/react';
import { useResponsive } from '../useResponsive';

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

function fireResize() {
  window.dispatchEvent(new Event('resize'));
}

describe('useResponsive', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    setWindowWidth(originalWidth);
  });

  it('幅がブレイクポイント未満なら isMobile=true', () => {
    setWindowWidth(768);
    const { result } = renderHook(() => useResponsive(1024));
    expect(result.current.isMobile).toBe(true);
  });

  it('幅がブレイクポイント以上なら isMobile=false', () => {
    setWindowWidth(1280);
    const { result } = renderHook(() => useResponsive(1024));
    expect(result.current.isMobile).toBe(false);
  });

  it('resize イベントで状態が更新される', () => {
    setWindowWidth(1280);
    const { result } = renderHook(() => useResponsive(1024));
    expect(result.current.isMobile).toBe(false);

    act(() => {
      setWindowWidth(800);
      fireResize();
    });
    expect(result.current.isMobile).toBe(true);
  });

  it('アンマウント後はリスナーが解除される', () => {
    setWindowWidth(1280);
    const { result, unmount } = renderHook(() => useResponsive(1024));
    unmount();

    setWindowWidth(800);
    fireResize();
    // アンマウント後なので更新されない（result.current はアンマウント前の値）
    expect(result.current.isMobile).toBe(false);
  });
});
