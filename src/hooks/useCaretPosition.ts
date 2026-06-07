import { useRef } from 'react';

/**
 * キャレット（テキストカーソル）位置を管理するフック。
 * TextEntry / TimelineEntry で重複していたカーソル位置取得・復元ロジックを共通化。
 */

/** クリック位置のキャレットノードとローカルオフセットを取得する（2 API のフォールバック付き）。 */
function caretNodeAt(x: number, y: number): { node: Node; offset: number } | null {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  const cp = (
    document as Document & {
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null;
    }
  ).caretPositionFromPoint?.(x, y);
  return cp ? { node: cp.offsetNode, offset: cp.offset } : null;
}

/**
 * マウス座標からキャレットのローカルオフセットを取得する。
 * 返すのはクリックしたテキストノード内のローカル位置で、複数ノードにまたがる本文の
 * 絶対位置ではない。絶対位置が要るときは {@link useCaretPosition} の captureFromMouseEvent を使う。
 * 両 API 非対応環境では null。
 */
export function getCaretOffset(x: number, y: number): number | null {
  return caretNodeAt(x, y)?.offset ?? null;
}

/**
 * container 先頭から (node, offset) までの文字数（＝コンテナ内の絶対文字オフセット）を返す。
 * node が container 外、または Range 構築に失敗した場合は null。
 */
function absoluteOffset(container: Node, node: Node, offset: number): number | null {
  if (!container.contains(node)) return null;
  const range = document.createRange();
  range.selectNodeContents(container);
  try {
    range.setEnd(node, offset);
  } catch {
    return null;
  }
  return range.toString().length;
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

  /**
   * クリック/選択位置を、本文コンテナ先頭からの絶対文字オフセットとして記録する。
   *
   * 本文（EntryContentView）はテキスト・色付きキャラ名・検索リンクが個別の span に分かれるため、
   * caretRangeFromPoint が返す startOffset は「クリックしたノード内のローカル位置」でしかない。
   * これを textarea の絶対位置に使うとカーソルがずれる。そこで container 先頭からクリック点までの
   * Range を作り、その文字数を絶対オフセットとして用いる。
   *
   * 引数 container は本文表示要素（クリックされた要素自身）。contentLength は算出失敗時の
   * フォールバック（末尾）に使う。
   *
   * 既知の近似: 検索リンクは表示上ブラケット `[]` を含まないため、リンクより後ろをクリックすると
   * 算出オフセットが元テキストと最大数文字ずれる。実害は小さく、従来のノードローカル誤用より大幅に改善される。
   */
  const captureFromMouseEvent = (
    e: React.MouseEvent,
    container: HTMLElement,
    contentLength: number,
  ) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const start = absoluteOffset(container, range.startContainer, range.startOffset);
      const end = absoluteOffset(container, range.endContainer, range.endOffset);
      if (start !== null && end !== null) {
        pendingSelectionRef.current = { start, end };
        pendingCursorRef.current = null;
        return;
      }
    }
    const caret = caretNodeAt(e.clientX, e.clientY);
    const abs = caret ? absoluteOffset(container, caret.node, caret.offset) : null;
    pendingCursorRef.current = abs ?? contentLength;
    pendingSelectionRef.current = null;
  };

  return {
    pendingCursorRef,
    pendingSelectionRef,
    applyPendingCursor,
    captureFromMouseEvent,
  };
}
