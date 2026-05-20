import type { Character, LinkKeyword } from '@/types/memo';

export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'character'; character: Character }
  | { type: 'search-link'; keyword: string };

/**
 * トークン検出用の内部表現。
 * `key` がテキスト中で検索される文字列、`build` がヒット時に生成するセグメント。
 */
interface DetectionToken {
  key: string;
  build: () => TextSegment;
}

/**
 * テキストをセグメント列に分解する。パースは2段階:
 *   1. `[キーワード]` パターンを検出して search-link セグメントに変換
 *   2. 残ったテキスト部分にキャラ名 + リンクキーワード辞書を
 *      「長い順優先・先頭マッチ」で同時検出する
 *
 * `[...]` を先に処理することで、ブラケット内のキャラ名やリンクワードが
 * 誤検出されるのを防ぐ。
 *
 * キャラ名とリンクキーワードは同一の優先順位プールで扱われ、長い方が勝つ。
 * 例: キャラ名「医者」とリンクキーワード「医者の証言」が両方ある場合、
 *     「医者の証言は怪しい」では「医者の証言」が優先される。
 */
export function parseCharacterText(
  text: string,
  characters: Character[],
  linkKeywords: LinkKeyword[] = [],
): TextSegment[] {
  if (!text) return [{ type: 'text', content: text }];

  // ─── Step 1: [キーワード] を検出して粗セグメントに分割 ─────────────────────
  const rawSegments = splitBySearchLinks(text);

  // ─── Step 2: キャラ名 + リンクキーワードを統合した長い順優先プールを構築 ──
  const tokens: DetectionToken[] = [];
  for (const char of characters) {
    if (!char.name) continue;
    tokens.push({
      key: char.name,
      build: () => ({ type: 'character', character: char }),
    });
  }
  for (const kw of linkKeywords) {
    if (!kw.keyword) continue;
    tokens.push({
      key: kw.keyword,
      build: () => ({ type: 'search-link', keyword: kw.keyword }),
    });
  }
  tokens.sort((a, b) => b.key.length - a.key.length);

  const result: TextSegment[] = [];
  for (const raw of rawSegments) {
    if (raw.type !== 'text') {
      result.push(raw);
      continue;
    }
    if (tokens.length === 0) {
      result.push(raw);
      continue;
    }
    for (const seg of detectTokens(raw.content, tokens)) {
      result.push(seg);
    }
  }

  return result;
}

/**
 * テキスト中の `[キーワード]` パターンを検出し、
 * text / search-link の粗セグメント列に分割する。
 * 空ブラケット `[]` はプレーンテキストとして扱う。
 */
function splitBySearchLinks(text: string): TextSegment[] {
  const result: TextSegment[] = [];
  // `[テキスト]` 抽出用の正規表現。
  // 同じパターンが `linkKeywords.ts` の `BRACKET_PATTERN` にも存在する（自動辞書登録用）。
  // パターンを変更する場合は両方更新すること。
  const re = /\[([^[\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    result.push({ type: 'search-link', keyword: match[1] });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return result;
}

/**
 * テキスト中のトークン（キャラ名 / リンクキーワード）を検出し、
 * セグメント配列に分解する。tokens は key 長の降順でソート済みであること。
 *
 * - 長い key を優先してマッチする（"凶器の場所" と "凶器" が両方ある場合、長い方を優先）
 * - key は完全一致で検索。前後の文字種は問わない
 * - 連続するテキストはマージする
 */
function detectTokens(text: string, tokens: DetectionToken[]): TextSegment[] {
  const result: TextSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 先頭にマッチするトークンを探す
    let headMatch: DetectionToken | null = null;
    for (const token of tokens) {
      if (remaining.startsWith(token.key)) {
        headMatch = token;
        break;
      }
    }

    if (headMatch) {
      result.push(headMatch.build());
      remaining = remaining.slice(headMatch.key.length);
    } else {
      // 次にいずれかのトークンが現れる位置を探す
      let nextIdx = remaining.length;
      for (const token of tokens) {
        const idx = remaining.indexOf(token.key, 1);
        if (idx > 0 && idx < nextIdx) {
          nextIdx = idx;
        }
      }

      // nextIdx までをテキストとして追加（連続するテキストはマージ）
      const chunk = remaining.slice(0, nextIdx);
      const last = result[result.length - 1];
      if (last?.type === 'text') {
        last.content += chunk;
      } else {
        result.push({ type: 'text', content: chunk });
      }
      remaining = remaining.slice(nextIdx);
    }
  }

  return result;
}

/**
 * テキスト中で検出されたキャラクターの ID 一覧を返す（重複なし）。
 *
 * `parseCharacterText` と同じ統合パースを通すため、リンクキーワードと
 * キャラ名が衝突した場合は本文表示と整合した結果になる
 * （例: キャラ「医者」+ 辞書「医者の証言」+ 本文「医者の証言は怪しい」では
 *  辞書ワードが優先されるため、キャラ「医者」は検出されない）。
 *
 * リンクキーワードはこの関数の戻り値（キャラ ID 列）には現れない。
 */
export function detectInlineCharacterIds(
  text: string,
  characters: Character[],
  linkKeywords: LinkKeyword[] = [],
): string[] {
  const seen = new Set<string>();
  for (const seg of parseCharacterText(text, characters, linkKeywords)) {
    if (seg.type === 'character') seen.add(seg.character.id);
  }
  return [...seen];
}
