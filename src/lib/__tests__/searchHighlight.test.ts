import { buildSnippetSegments, highlightSegments } from '../searchHighlight';

/** セグメント列を「ハイライト部分だけ」の配列に畳む（マージ結果の検証用ヘルパー）。 */
function marks(segments: { text: string; highlighted: boolean }[]): string[] {
  return segments.filter((s) => s.highlighted).map((s) => s.text);
}

/** セグメント列を素のテキストに戻す（情報欠落が無いことの検証用）。 */
function plain(segments: { text: string; highlighted: boolean }[]): string {
  return segments.map((s) => s.text).join('');
}

// ─── highlightSegments ───────────────────────────────────────────────────────

describe('highlightSegments', () => {
  it('一致が無ければ全体を非ハイライトの1セグメントで返す', () => {
    expect(highlightSegments('abcdef', ['zzz'])).toEqual([{ text: 'abcdef', highlighted: false }]);
  });

  it('空テキストは空配列', () => {
    expect(highlightSegments('', ['a'])).toEqual([]);
  });

  it('単一キーワードを大文字小文字無視でハイライトする', () => {
    const segs = highlightSegments('Hello World', ['world']);
    expect(marks(segs)).toEqual(['World']);
    expect(plain(segs)).toBe('Hello World');
  });

  it('同一キーワードの複数出現をすべてハイライトする', () => {
    const segs = highlightSegments('aXaXa', ['x']);
    expect(marks(segs)).toEqual(['X', 'X']);
  });

  it('重なる一致区間をマージして二重ハイライトしない', () => {
    // 'aba' に対し 'ab' と 'ba' は index 0-2 / 1-3 で重なる → 全体が1区間
    const segs = highlightSegments('aba', ['ab', 'ba']);
    expect(marks(segs)).toEqual(['aba']);
    expect(plain(segs)).toBe('aba');
  });

  it('隣接する一致区間をマージする', () => {
    // 'abcd' に 'ab'(0-2) と 'cd'(2-4) は隣接 → 1区間 'abcd'
    const segs = highlightSegments('abcd', ['ab', 'cd']);
    expect(marks(segs)).toEqual(['abcd']);
  });

  it('離れた一致は別々のハイライト区間になる', () => {
    const segs = highlightSegments('a__b', ['a', 'b']);
    expect(marks(segs)).toEqual(['a', 'b']);
    expect(plain(segs)).toBe('a__b');
  });
});

// ─── buildSnippetSegments ────────────────────────────────────────────────────

describe('buildSnippetSegments', () => {
  it('本文一致なし（タグ/グループのみ一致）は冒頭120文字を非ハイライトで返す', () => {
    const content = 'あ'.repeat(200);
    const segs = buildSnippetSegments(content, ['zzz']);
    expect(segs).toEqual([{ text: 'あ'.repeat(120), highlighted: false }]);
  });

  it('空本文は空配列', () => {
    expect(buildSnippetSegments('', ['a'])).toEqual([]);
  });

  it('短い本文では前後の … を付けない', () => {
    const segs = buildSnippetSegments('毒物を発見', ['毒物']);
    expect(plain(segs)).toBe('毒物を発見');
    expect(segs.some((s) => s.text === '…')).toBe(false);
    expect(marks(segs)).toEqual(['毒物']);
  });

  it('マッチが先頭から離れていれば前方に … を付ける', () => {
    const content = 'x'.repeat(100) + '毒物';
    const segs = buildSnippetSegments(content, ['毒物']);
    expect(segs[0]).toEqual({ text: '…', highlighted: false });
    expect(marks(segs)).toEqual(['毒物']);
  });

  it('マッチ後に文字が続けば後方に … を付ける', () => {
    const content = '毒物' + 'y'.repeat(100);
    const segs = buildSnippetSegments(content, ['毒物']);
    expect(segs[segs.length - 1]).toEqual({ text: '…', highlighted: false });
  });

  it('切り出し窓の中の複数キーワードをハイライトする', () => {
    const segs = buildSnippetSegments('田中が毒物を持っていた', ['田中', '毒物']);
    expect(marks(segs)).toEqual(['田中', '毒物']);
  });
});
