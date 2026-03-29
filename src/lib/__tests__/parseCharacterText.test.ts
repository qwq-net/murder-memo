import { describe, expect, it } from 'vitest';

import type { Character } from '@/types/memo';
import { detectInlineCharacterIds, parseCharacterText } from '@/lib/parseCharacterText';

const makeChar = (id: string, name: string): Character => ({
  id,
  name,
  color: '#ffffff',
  sortOrder: 0,
  role: 'pl',
  showInEntries: true,
});

const 登山家 = makeChar('c1', '登山家');
const 調査員 = makeChar('c2', '調査員');
const 医者 = makeChar('c3', '医者');
const 山田太郎 = makeChar('c4', '山田太郎');
const 山田 = makeChar('c5', '山田');

describe('parseCharacterText', () => {
  it('空文字は text セグメント1つを返す', () => {
    expect(parseCharacterText('', [登山家])).toEqual([{ type: 'text', content: '' }]);
  });

  it('キャラクターなしの場合は text セグメント1つを返す', () => {
    expect(parseCharacterText('ふつうのメモ', [])).toEqual([{ type: 'text', content: 'ふつうのメモ' }]);
  });

  it('マッチしないテキストは text セグメント1つを返す', () => {
    expect(parseCharacterText('関係ないメモ', [登山家])).toEqual([
      { type: 'text', content: '関係ないメモ' },
    ]);
  });

  it('テキスト先頭のキャラ名を検出する', () => {
    const result = parseCharacterText('登山家→調査員', [登山家, 調査員]);
    expect(result).toEqual([
      { type: 'character', character: 登山家 },
      { type: 'text', content: '→' },
      { type: 'character', character: 調査員 },
    ]);
  });

  it('キャラ名がテキスト中間に現れる場合', () => {
    const result = parseCharacterText('今日、登山家が来た', [登山家]);
    expect(result).toEqual([
      { type: 'text', content: '今日、' },
      { type: 'character', character: 登山家 },
      { type: 'text', content: 'が来た' },
    ]);
  });

  it('複数キャラを順番通り検出する', () => {
    const result = parseCharacterText('登山家→医者→調査員', [登山家, 調査員, 医者]);
    expect(result).toEqual([
      { type: 'character', character: 登山家 },
      { type: 'text', content: '→' },
      { type: 'character', character: 医者 },
      { type: 'text', content: '→' },
      { type: 'character', character: 調査員 },
    ]);
  });

  it('長い名前を短い名前より優先してマッチする', () => {
    // "山田太郎" と "山田" が両方いる場合、"山田太郎" を優先
    const result = parseCharacterText('山田太郎の話', [山田, 山田太郎]);
    expect(result).toEqual([
      { type: 'character', character: 山田太郎 },
      { type: 'text', content: 'の話' },
    ]);
  });

  it('同じキャラが複数回出てきても両方検出する', () => {
    const result = parseCharacterText('登山家と登山家', [登山家]);
    expect(result).toEqual([
      { type: 'character', character: 登山家 },
      { type: 'text', content: 'と' },
      { type: 'character', character: 登山家 },
    ]);
  });

  it('連続するテキスト部分はマージされる', () => {
    const result = parseCharacterText('aaa bbb ccc', [登山家]);
    expect(result).toEqual([{ type: 'text', content: 'aaa bbb ccc' }]);
  });

  it('[キーワード] を search-link セグメントに変換する', () => {
    const result = parseCharacterText('[調査員の妻]が怪しい', []);
    expect(result).toEqual([
      { type: 'search-link', keyword: '調査員の妻' },
      { type: 'text', content: 'が怪しい' },
    ]);
  });

  it('ブラケット内のキャラ名はキャラ検出されない', () => {
    const result = parseCharacterText('[登山家]の話', [登山家]);
    expect(result).toEqual([
      { type: 'search-link', keyword: '登山家' },
      { type: 'text', content: 'の話' },
    ]);
  });

  it('search-link とキャラ名が混在する', () => {
    const result = parseCharacterText('登山家が[凶器]を持っていた', [登山家]);
    expect(result).toEqual([
      { type: 'character', character: 登山家 },
      { type: 'text', content: 'が' },
      { type: 'search-link', keyword: '凶器' },
      { type: 'text', content: 'を持っていた' },
    ]);
  });

  it('複数の search-link が並ぶ', () => {
    const result = parseCharacterText('[凶器]と[アリバイ]', []);
    expect(result).toEqual([
      { type: 'search-link', keyword: '凶器' },
      { type: 'text', content: 'と' },
      { type: 'search-link', keyword: 'アリバイ' },
    ]);
  });

  it('空のブラケット [] はテキストとして扱う', () => {
    const result = parseCharacterText('これ[]はリンクでない', []);
    expect(result).toEqual([{ type: 'text', content: 'これ[]はリンクでない' }]);
  });
});

describe('detectInlineCharacterIds', () => {
  it('検出されたキャラIDを重複なしで返す', () => {
    const ids = detectInlineCharacterIds('登山家と登山家と調査員', [登山家, 調査員, 医者]);
    expect(ids).toContain('c1');
    expect(ids).toContain('c2');
    expect(ids).not.toContain('c3');
    expect(ids).toHaveLength(2);
  });

  it('マッチなしの場合は空配列を返す', () => {
    expect(detectInlineCharacterIds('関係ない', [登山家])).toEqual([]);
  });
});
