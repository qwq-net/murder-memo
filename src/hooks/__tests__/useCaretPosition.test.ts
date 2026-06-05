import { renderHook } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
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
      get selectionStart() {
        return selStart;
      },
      get selectionEnd() {
        return selEnd;
      },
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

  it('captureFromMouseEvent は複数 span にまたがる選択を絶対オフセットで記録する', () => {
    // 本文 "ABCDE" を 2 つの span（"AB" + "CDE"）に分けて描画した状況を再現
    const container = document.createElement('div');
    const span1 = document.createElement('span');
    span1.textContent = 'AB';
    const span2 = document.createElement('span');
    span2.textContent = 'CDE';
    container.append(span1, span2);
    document.body.appendChild(container);

    // 先頭から 2 番目の span の途中（"ABCD"）までを選択
    const range = document.createRange();
    range.setStart(span1.firstChild!, 0);
    range.setEnd(span2.firstChild!, 2);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    const { result } = renderHook(() => useCaretPosition());
    result.current.captureFromMouseEvent(
      { clientX: 0, clientY: 0 } as unknown as ReactMouseEvent,
      container,
      5,
    );

    // ノードローカル（span2 内の 2）ではなく、本文先頭からの絶対位置 4 が記録される
    expect(result.current.pendingSelectionRef.current).toEqual({ start: 0, end: 4 });

    document.body.removeChild(container);
  });
});
