import { renderHook } from '@testing-library/react';
import { getCaretOffset, useCaretPosition } from '../useCaretPosition';

describe('getCaretOffset', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).caretRangeFromPoint;
  });

  it('caretRangeFromPoint が使える場合はオフセットを返す', () => {
    const mockRange = { startOffset: 5 };
    // jsdom には caretRangeFromPoint が存在しないため直接定義
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).caretRangeFromPoint = vi.fn(() => mockRange);

    expect(getCaretOffset(100, 200)).toBe(5);
  });

  it('caretRangeFromPoint が null を返す場合は null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).caretRangeFromPoint = vi.fn(() => null);

    expect(getCaretOffset(100, 200)).toBeNull();
  });
});

describe('useCaretPosition', () => {
  function mockTextarea(): HTMLTextAreaElement {
    let selStart = 0;
    let selEnd = 0;
    return {
      value: 'hello world',
      get selectionStart() { return selStart; },
      get selectionEnd() { return selEnd; },
      setSelectionRange(start: number, end: number) {
        selStart = start;
        selEnd = end;
      },
    } as unknown as HTMLTextAreaElement;
  }

  it('applyPendingCursor で保留位置が textarea に適用される', () => {
    const { result } = renderHook(() => useCaretPosition());

    // カーソル位置を手動で設定
    result.current.pendingCursorRef.current = 3;
    const el = mockTextarea();
    result.current.applyPendingCursor(el);

    expect(el.selectionStart).toBe(3);
    expect(el.selectionEnd).toBe(3);
    // 適用後にリセットされる
    expect(result.current.pendingCursorRef.current).toBeNull();
  });

  it('保留選択範囲が textarea に適用される', () => {
    const { result } = renderHook(() => useCaretPosition());

    result.current.pendingSelectionRef.current = { start: 2, end: 7 };
    const el = mockTextarea();
    result.current.applyPendingCursor(el);

    expect(el.selectionStart).toBe(2);
    expect(el.selectionEnd).toBe(7);
    expect(result.current.pendingSelectionRef.current).toBeNull();
  });

  it('保留位置なしの場合は末尾にカーソルを置く', () => {
    const { result } = renderHook(() => useCaretPosition());

    const el = mockTextarea();
    result.current.applyPendingCursor(el);

    expect(el.selectionStart).toBe(el.value.length);
    expect(el.selectionEnd).toBe(el.value.length);
  });
});
