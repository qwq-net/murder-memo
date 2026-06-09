import type { Character, MemoEntry, MemoGroup, PanelId, TimelineGroup } from '@/types/memo';
import { searchEntries, tokenizeQuery, type SearchContext } from '../entrySearch';

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
  return { color: '#fff', sortOrder: 0, role: 'pl', showInEntries: true, ...overrides };
}

function makeTlGroup(overrides: Partial<TimelineGroup> & { id: string }): TimelineGroup {
  return { sessionId: 's1', label: 'グループ', sortOrder: 0, collapsed: false, ...overrides };
}

function makeMemoGroup(overrides: Partial<MemoGroup> & { id: string }): MemoGroup {
  return {
    sessionId: 's1',
    panel: 'free',
    label: 'グループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

const ORDER: PanelId[] = ['free', 'timeline', 'personal'];

function ctx(overrides: Partial<SearchContext>): SearchContext {
  return {
    entries: [],
    characters: [],
    timelineGroups: [],
    memoGroups: [],
    order: ORDER,
    maxResults: 50,
    ...overrides,
  };
}

// ─── tokenizeQuery ───────────────────────────────────────────────────────────

describe('tokenizeQuery', () => {
  it('スペースで分解し、小文字化・空要素除去する', () => {
    expect(tokenizeQuery('  Foo  BAR ')).toEqual(['foo', 'bar']);
  });

  it('空文字は空配列', () => {
    expect(tokenizeQuery('   ')).toEqual([]);
  });
});

// ─── searchEntries ───────────────────────────────────────────────────────────

describe('searchEntries', () => {
  it('キーワードが無ければ空配列', () => {
    expect(searchEntries('', ctx({ entries: [makeEntry({ id: '1', content: 'x' })] }))).toEqual([]);
  });

  it('本文を部分一致で検索する', () => {
    const entries = [
      makeEntry({ id: '1', content: '毒物を発見した' }),
      makeEntry({ id: '2', content: '無関係なメモ' }),
    ];
    const result = searchEntries('毒物', ctx({ entries }));
    expect(result).toHaveLength(1);
    expect(result[0].matches.map((m) => m.entry.id)).toEqual(['1']);
  });

  it('複数キーワードは AND（すべて含むエントリのみ）', () => {
    const entries = [
      makeEntry({ id: '1', content: '田中が毒物を持っていた' }),
      makeEntry({ id: '2', content: '田中はアリバイがある' }),
    ];
    const result = searchEntries('田中 毒物', ctx({ entries }));
    expect(result[0].matches.map((m) => m.entry.id)).toEqual(['1']);
  });

  it('AND は本文・タグ名・グループ名をまたいで成立する', () => {
    const entries = [makeEntry({ id: '1', content: '毒物', characterTags: ['a'], groupId: 'g1' })];
    const result = searchEntries(
      '毒物 田中', // 毒物=本文 / 田中=タグ名
      ctx({
        entries,
        characters: [makeChar({ id: 'a', name: '田中' })],
        memoGroups: [makeMemoGroup({ id: 'g1' })],
      }),
    );
    expect(result[0].matches).toHaveLength(1);
    expect(result[0].matches[0].matchedCharacterNames).toEqual(['田中']);
  });

  it('タグ付けされたキャラ名で一致し、一致理由を返す', () => {
    const entries = [makeEntry({ id: '1', content: '怪しい', characterTags: ['a'] })];
    const result = searchEntries(
      '田中',
      ctx({ entries, characters: [makeChar({ id: 'a', name: '田中' })] }),
    );
    expect(result[0].matches[0].matchedCharacterNames).toEqual(['田中']);
    expect(result[0].matches[0].matchedGroupLabel).toBeNull();
  });

  it('グループ名で一致し、一致理由を返す（タイムライン）', () => {
    const entries = [
      makeEntry({ id: '1', panel: 'timeline', content: '移動', timelineGroupId: 'tg1' }),
    ];
    const result = searchEntries(
      '事件当日',
      ctx({ entries, timelineGroups: [makeTlGroup({ id: 'tg1', label: '事件当日' })] }),
    );
    expect(result[0].matches[0].matchedGroupLabel).toBe('事件当日');
  });

  it('メモグループ名で一致し、一致理由を返す（非タイムライン）', () => {
    const entries = [makeEntry({ id: '1', panel: 'free', content: '何か', groupId: 'g1' })];
    const result = searchEntries(
      '証拠品',
      ctx({ entries, memoGroups: [makeMemoGroup({ id: 'g1', label: '証拠品' })] }),
    );
    expect(result[0].matches[0].matchedGroupLabel).toBe('証拠品');
  });

  it('グループ所属でも本文で一致したなら matchedGroupLabel は null', () => {
    const entries = [makeEntry({ id: '1', content: '毒物', groupId: 'g1' })];
    const result = searchEntries(
      '毒物',
      ctx({ entries, memoGroups: [makeMemoGroup({ id: 'g1', label: '事件現場' })] }),
    );
    expect(result[0].matches[0].matchedGroupLabel).toBeNull();
  });

  it('複数タグのうちキーワード一致した名前だけ返し、空名タグは無視する', () => {
    const entries = [makeEntry({ id: '1', content: 'x', characterTags: ['a', 'b', 'c'] })];
    const result = searchEntries(
      '田中 x',
      ctx({
        entries,
        characters: [
          makeChar({ id: 'a', name: '田中' }),
          makeChar({ id: 'b', name: '佐藤' }), // 不一致
          makeChar({ id: 'c', name: '' }), // 空名は除外
        ],
      }),
    );
    expect(result[0].matches[0].matchedCharacterNames).toEqual(['田中']);
  });

  it('画像エントリは検索対象外', () => {
    const entries = [makeEntry({ id: '1', type: 'image', content: '毒物の写真' })];
    expect(searchEntries('毒物', ctx({ entries }))).toEqual([]);
  });

  it('結果はパネル順にグループ化される', () => {
    const entries = [
      makeEntry({ id: 'p', panel: 'personal', content: 'X' }),
      makeEntry({ id: 'f', panel: 'free', content: 'X' }),
    ];
    const result = searchEntries('x', ctx({ entries }));
    expect(result.map((g) => g.panel)).toEqual(['free', 'personal']);
  });

  it('maxResults で全体件数を打ち切る', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: String(i), content: 'hit' }),
    );
    const result = searchEntries('hit', ctx({ entries, maxResults: 3 }));
    const total = result.reduce((sum, g) => sum + g.matches.length, 0);
    expect(total).toBe(3);
  });

  it('maxResults はパネル跨ぎで打ち切り、先頭パネルから順に埋まる', () => {
    const entries = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeEntry({ id: `f${i}`, panel: 'free', content: 'hit' }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeEntry({ id: `p${i}`, panel: 'personal', content: 'hit' }),
      ),
    ];
    const result = searchEntries('hit', ctx({ entries, maxResults: 4 }));
    expect(result.find((g) => g.panel === 'free')?.matches).toHaveLength(3);
    expect(result.find((g) => g.panel === 'personal')?.matches).toHaveLength(1);
  });
});
