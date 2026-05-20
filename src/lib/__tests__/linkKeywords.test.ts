import { describe, expect, it } from 'vitest';

import { extractBracketedWords } from '@/lib/linkKeywords';

describe('extractBracketedWords', () => {
  it('空文字は空配列を返す', () => {
    expect(extractBracketedWords('')).toEqual([]);
  });

  it('[] を含まないテキストは空配列を返す', () => {
    expect(extractBracketedWords('普通のメモ')).toEqual([]);
  });

  it('単一の [テキスト] を抽出する', () => {
    expect(extractBracketedWords('[凶器]はキッチン')).toEqual(['凶器']);
  });

  it('複数の [テキスト] を出現順で抽出する', () => {
    expect(extractBracketedWords('[凶器]を持って[現場]へ行った')).toEqual(['凶器', '現場']);
  });

  it('重複は1度だけ返す', () => {
    expect(extractBracketedWords('[凶器]と[凶器]')).toEqual(['凶器']);
  });

  it('空ブラケット [] は無視する', () => {
    expect(extractBracketedWords('テスト[]だけ')).toEqual([]);
  });

  it('空白のみのブラケット [   ] は無視する', () => {
    expect(extractBracketedWords('テスト[   ]だけ')).toEqual([]);
  });

  it('前後の空白は trim される', () => {
    expect(extractBracketedWords('[ 凶器 ]')).toEqual(['凶器']);
  });

  it('ネストは検出されない（外側が優先される正規表現挙動）', () => {
    // `[[X]]` の中身は `[X` か `X]` のいずれもネスト用文字を含むため検出されない
    // 外側 `[X]` のみ拾う想定だが、`[^\[\]]+` のため `[[X]]` の中の `X` は単独でマッチする
    expect(extractBracketedWords('[[X]]')).toEqual(['X']);
  });

  it('複数行に跨いでも各行の [] を抽出できる', () => {
    expect(extractBracketedWords('1行目[A]\n2行目[B]')).toEqual(['A', 'B']);
  });
});
