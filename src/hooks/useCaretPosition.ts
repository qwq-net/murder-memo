import { useRef } from 'react';

/**
 * キャレット（テキストカーソル）位置を管理するフック。
 * TextEntry / TimelineEntry で重複していたカーソル位置取得・復元ロジックを共通化。
 */

/** マウス座標からキャレットのオフセット位置を取得する */
export function getCaretOffset(x: number, y: number): number | null {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? r.startOffset : null;
  }
  const cp = (document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offset: number } | null;
  }).caretPositionFromPoint?.(x, y);
  return cp ? cp.offset : null;
}

export function useCaretPosition() {
  const pendingCursorRef = useRef<number | null>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  /** 保留中のカーソル位置/選択範囲を textarea に適用する */
  const applyPendingCursor = (el: HTMLTextAreaElement) => {
    if (pendingSelectionRef.current !== null) {
      const { start, end } = pendingSelectionRef.current;
      el.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    } else if (pendingCursorRef.current !== null) {
      const pos = pendingCursorRef.current;
      el.setSelectionRange(pos, pos);
      pendingCursorRef.current = null;
    } else {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  /** マウスイベントからカーソル位置を記録する */
  const captureFromMouseEvent = (e: React.MouseEvent, contentLength: number) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      pendingSelectionRef.current = { start: range.startOffset, end: range.endOffset };
      pendingCursorRef.current = null;
    } else {
      pendingCursorRef.current = getCaretOffset(e.clientX, e.clientY) ?? contentLength;
      pendingSelectionRef.current = null;
    }
  };

  return {
    pendingCursorRef,
    pendingSelectionRef,
    applyPendingCursor,
    captureFromMouseEvent,
  };
}
