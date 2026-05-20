/**
 * リンクキーワード辞書まわりのユーティリティ。
 *
 * - `extractBracketedWords`: テキスト中の `[テキスト]` 形式から
 *   キーワード文字列を抽出する（重複・空文字を除外）。
 *
 * パーサ本体（parseCharacterText）が `[]` をセグメント化するのに対し、
 * こちらは「確定時に自動辞書登録するため」の純粋な抽出関数として独立させている。
 */

// 同じパターンが `parseCharacterText.ts` の `splitBySearchLinks` 内にも存在する（パース用）。
// パターンを変更する場合は両方更新すること。
const BRACKET_PATTERN = /\[([^[\]]+)\]/g;

/**
 * 与えられたテキストから `[テキスト]` 形式の中身を抽出する。
 *
 * - 空白のみの中身（例: `[ ]`）は除外
 * - 前後の空白は trim する
 * - 同一キーワードは1度だけ返す（順序は最初の出現順）
 */
export function extractBracketedWords(text: string): string[] {
  if (!text) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const match of text.matchAll(BRACKET_PATTERN)) {
    const word = match[1].trim();
    if (!word) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    result.push(word);
  }

  return result;
}
