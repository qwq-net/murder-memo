/**
 * 検索結果スニペットのハイライト生成ロジック（純関数・UI 非依存）。
 *
 * 「どこを強調表示するか」を {text, highlighted} のセグメント列として返し、描画（<mark> 化）は
 * 呼び手（searchResultItem）に委ねる。これにより React に依存せず単体テストできる
 * （src/lib/__tests__/searchHighlight.test.ts）。複数キーワードの重なり・隣接マージや
 * `…` の付与など、退行しやすいロジックをここに閉じ込める。
 */

export interface HighlightSegment {
  text: string;
  /** この区間がキーワード一致部分（<mark> 対象）か */
  highlighted: boolean;
}

/** マッチ周辺の切り出し幅（前後の文字数） */
const CONTEXT_RADIUS = 50;
/** 本文にキーワードが無いときに表示する冒頭の文字数 */
const SNIPPET_FALLBACK_LEN = 120;

/**
 * テキスト中の全キーワード出現箇所をハイライト区間としてセグメント化する。
 * 重なり・隣接する一致区間はマージしてから返す（二重 <mark> を防ぐ）。
 */
export function highlightSegments(text: string, terms: string[]): HighlightSegment[] {
  const lower = text.toLowerCase();

  // 全キーワードの一致区間 [start, end) を収集
  const ranges: [number, number][] = [];
  for (const t of terms) {
    if (!t) continue;
    let i = lower.indexOf(t);
    while (i !== -1) {
      ranges.push([i, i + t.length]);
      i = lower.indexOf(t, i + t.length);
    }
  }
  if (ranges.length === 0) return text ? [{ text, highlighted: false }] : [];

  // 重なり・隣接（start <= 直前の end）をマージ
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) {
      last[1] = Math.max(last[1], r[1]);
    } else {
      merged.push([r[0], r[1]]);
    }
  }

  // マージ済み区間とその間の非一致区間を交互に並べる
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}

/**
 * マッチ箇所周辺を切り出し、複数キーワードをハイライトしたスニペットのセグメント列を返す。
 * 本文にどのキーワードも現れない（タグ/グループ名のみで一致した）場合は冒頭を切り出すだけ。
 */
export function buildSnippetSegments(content: string, terms: string[]): HighlightSegment[] {
  const lower = content.toLowerCase();

  // 本文中で最も早く現れるキーワード位置を探す
  let firstIdx = -1;
  let firstLen = 0;
  for (const t of terms) {
    if (!t) continue;
    const i = lower.indexOf(t);
    if (i !== -1 && (firstIdx === -1 || i < firstIdx)) {
      firstIdx = i;
      firstLen = t.length;
    }
  }

  // 本文一致なし → 冒頭のみ（ハイライトなし）
  if (firstIdx === -1) {
    const head = content.slice(0, SNIPPET_FALLBACK_LEN);
    return head ? [{ text: head, highlighted: false }] : [];
  }

  // マッチ周辺 ~120 文字を切り出す
  const start = Math.max(0, firstIdx - CONTEXT_RADIUS);
  const end = Math.min(content.length, firstIdx + firstLen + CONTEXT_RADIUS);
  const slice = content.slice(start, end);

  const segments: HighlightSegment[] = [];
  if (start > 0) segments.push({ text: '…', highlighted: false });
  segments.push(...highlightSegments(slice, terms));
  if (end < content.length) segments.push({ text: '…', highlighted: false });
  return segments;
}
