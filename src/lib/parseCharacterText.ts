import type { Character } from '@/types/memo';

export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'character'; character: Character }
  | { type: 'search-link'; keyword: string };

/**
 * テキストをセグメント列に分解する。パースは2段階:
 *   1. `[キーワード]` パターンを検出して search-link セグメントに変換
 *   2. 残ったテキスト部分にキャラクター名検出を適用して character セグメントに変換
 *
 * `[...]` を先に処理することで、ブラケット内のキャラ名が誤検出されるのを防ぐ。
 */
export function parseCharacterText(text: string, characters: Character[]): TextSegment[] {
  if (!text) return [{ type: 'text', content: text }];

  // ─── Step 1: [キーワード] を検出して粗セグメントに分割 ─────────────────────
  const rawSegments = splitBySearchLinks(text);

  // ─── Step 2: text セグメントにキャラクター名検出を適用 ─────────────────────
  const sorted = [...characters]
    .filter((c) => c.name.length > 0)
    .sort((a, b) => b.name.length - a.name.length);

  const result: TextSegment[] = [];
  for (const raw of rawSegments) {
    if (raw.type !== 'text') {
      result.push(raw);
      continue;
    }
    if (sorted.length === 0) {
      result.push(raw);
      continue;
    }
    for (const seg of detectCharacters(raw.content, sorted)) {
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
  const re = /\[([^\[\]]+)\]/g;
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
 * テキスト中のキャラクター名を検出し、セグメント配列に分解する。
 * sorted は名前長の降順でソート済みであること。
 *
 * - 長い名前を優先してマッチする（"山田太郎" と "山田" が両方いる場合、長い方を優先）
 * - キャラクター名は完全一致で検索。前後の文字種は問わない
 */
function detectCharacters(text: string, sorted: Character[]): TextSegment[] {
  const result: TextSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 先頭にマッチするキャラ名を探す
    let headMatch: Character | null = null;
    for (const char of sorted) {
      if (remaining.startsWith(char.name)) {
        headMatch = char;
        break;
      }
    }

    if (headMatch) {
      result.push({ type: 'character', character: headMatch });
      remaining = remaining.slice(headMatch.name.length);
    } else {
      // 次にキャラ名が現れる位置を探す
      let nextIdx = remaining.length;
      for (const char of sorted) {
        const idx = remaining.indexOf(char.name, 1);
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
 */
export function detectInlineCharacterIds(text: string, characters: Character[]): string[] {
  const seen = new Set<string>();
  for (const seg of parseCharacterText(text, characters)) {
    if (seg.type === 'character') seen.add(seg.character.id);
  }
  return [...seen];
}
