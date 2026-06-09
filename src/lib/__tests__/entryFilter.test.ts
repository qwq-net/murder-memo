import type { Character, ImportanceLevel, MemoEntry } from '@/types/memo';
import {
  filterEntries,
  isFilterActive,
  matchesEntryFilter,
  resolveCharacterNames,
  type EntryFilterCriteria,
} from '../entryFilter';

// ─── テストデータ生成ヘルパー ─────────────────────────────────────────────────

function makeEntry(overrides: Partial<MemoEntry> & { id: string }): MemoEntry {
  return {
    type: 'text',
    content: '',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    ...overrides,
  };
}

function makeChar(overrides: Partial<Character> & { id: string; name: string }): Character {
  return {
    color: '#e74c3c',
    sortOrder: 0,
    role: 'pl',
    showInEntries: true,
    ...overrides,
  };
}

const NO_CRITERIA: EntryFilterCriteria = {
  characterIds: [],
  characterNames: [],
  importanceLevels: [],
};

// ─── resolveCharacterNames ───────────────────────────────────────────────────

describe('resolveCharacterNames', () => {
  const chars = [
    makeChar({ id: 'a', name: '田中' }),
    makeChar({ id: 'b', name: '' }), // 空名は除外
    makeChar({ id: 'c', name: '佐藤' }),
  ];

  it('指定 ID のキャラ名のみ返し、空名は除外する', () => {
    expect(resolveCharacterNames(chars, ['a', 'b'])).toEqual(['田中']);
    expect(resolveCharacterNames(chars, ['a', 'c'])).toEqual(['田中', '佐藤']);
  });

  it('該当なしなら空配列', () => {
    expect(resolveCharacterNames(chars, ['x'])).toEqual([]);
  });
});

// ─── isFilterActive ──────────────────────────────────────────────────────────

describe('isFilterActive', () => {
  it('条件がすべて空なら false', () => {
    expect(isFilterActive(NO_CRITERIA)).toBe(false);
  });

  it('キャラまたは重要度のいずれかが指定されていれば true', () => {
    expect(isFilterActive({ ...NO_CRITERIA, characterIds: ['a'] })).toBe(true);
    expect(isFilterActive({ ...NO_CRITERIA, importanceLevels: ['high'] })).toBe(true);
  });
});

// ─── matchesEntryFilter ──────────────────────────────────────────────────────

describe('matchesEntryFilter', () => {
  it('条件なしはすべて通す', () => {
    expect(matchesEntryFilter(makeEntry({ id: '1' }), NO_CRITERIA)).toBe(true);
  });

  it('重要度フィルタ: 指定レベルに一致する重要度のみ通す', () => {
    const high = makeEntry({ id: '1', importance: 'high' });
    const low = makeEntry({ id: '2', importance: 'low' });
    const none = makeEntry({ id: '3' });
    const criteria = {
      ...NO_CRITERIA,
      importanceLevels: ['high', 'medium'] as ImportanceLevel[],
    };
    expect(matchesEntryFilter(high, criteria)).toBe(true);
    expect(matchesEntryFilter(low, criteria)).toBe(false);
    expect(matchesEntryFilter(none, criteria)).toBe(false);
  });

  it('キャラフィルタ: タグ一致で通す', () => {
    const tagged = makeEntry({ id: '1', characterTags: ['a'] });
    const criteria = { ...NO_CRITERIA, characterIds: ['a'], characterNames: ['田中'] };
    expect(matchesEntryFilter(tagged, criteria)).toBe(true);
  });

  it('キャラフィルタ: 本文にキャラ名を含めば通す', () => {
    const byName = makeEntry({ id: '1', content: '田中が怪しい' });
    const criteria = { ...NO_CRITERIA, characterIds: ['a'], characterNames: ['田中'] };
    expect(matchesEntryFilter(byName, criteria)).toBe(true);
  });

  it('キャラフィルタ: タグも名前も一致しなければ弾く', () => {
    const other = makeEntry({ id: '1', content: '無関係', characterTags: ['z'] });
    const criteria = { ...NO_CRITERIA, characterIds: ['a'], characterNames: ['田中'] };
    expect(matchesEntryFilter(other, criteria)).toBe(false);
  });

  it('空文字の characterNames が混ざっても本文に偽マッチしない', () => {
    // resolveCharacterNames が防いでいる不変条件を filter 本体側でも担保する
    const e = makeEntry({ id: '1', content: '無関係なメモ', characterTags: [] });
    const criteria = { ...NO_CRITERIA, characterIds: ['a'], characterNames: [''] };
    expect(matchesEntryFilter(e, criteria)).toBe(false);
  });

  it('複数キャラ指定で一部のタグだけ一致しても通す（some であり every でない）', () => {
    const e = makeEntry({ id: '1', characterTags: ['a'] });
    const criteria = {
      ...NO_CRITERIA,
      characterIds: ['a', 'b'],
      characterNames: ['田中', '佐藤'],
    };
    expect(matchesEntryFilter(e, criteria)).toBe(true);
  });

  it('キャラ × 重要度は AND（両方満たす必要がある）', () => {
    const criteria: EntryFilterCriteria = {
      characterIds: ['a'],
      characterNames: ['田中'],
      importanceLevels: ['high'],
    };
    expect(
      matchesEntryFilter(
        makeEntry({ id: '1', characterTags: ['a'], importance: 'high' }),
        criteria,
      ),
    ).toBe(true);
    // キャラは合うが重要度が違う
    expect(
      matchesEntryFilter(makeEntry({ id: '2', characterTags: ['a'], importance: 'low' }), criteria),
    ).toBe(false);
    // 重要度は合うがキャラが違う
    expect(
      matchesEntryFilter(
        makeEntry({ id: '3', characterTags: ['z'], importance: 'high' }),
        criteria,
      ),
    ).toBe(false);
  });
});

// ─── filterEntries ───────────────────────────────────────────────────────────

describe('filterEntries', () => {
  const entries = [
    makeEntry({ id: '1', characterTags: ['a'], importance: 'high' }),
    makeEntry({ id: '2', content: '田中の証言', importance: 'medium' }),
    makeEntry({ id: '3', characterTags: ['z'] }),
  ];

  it('条件なしは同じ配列を返す（参照そのまま）', () => {
    expect(filterEntries(entries, NO_CRITERIA)).toBe(entries);
  });

  it('重要度のみで絞り込む', () => {
    const result = filterEntries(entries, { ...NO_CRITERIA, importanceLevels: ['high'] });
    expect(result.map((e) => e.id)).toEqual(['1']);
  });

  it('キャラ（タグ or 本文）で絞り込む', () => {
    const result = filterEntries(entries, {
      ...NO_CRITERIA,
      characterIds: ['a'],
      characterNames: ['田中'],
    });
    expect(result.map((e) => e.id)).toEqual(['1', '2']);
  });
});
