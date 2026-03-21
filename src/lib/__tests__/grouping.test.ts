import type { MemoEntry, MemoGroup, TimelineGroup } from '@/types/memo';
import { groupEntriesByMemoGroup, groupEntriesByTimeline } from '../grouping';

// テスト用のエントリ生成ヘルパー
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

function makeGroup(overrides: Partial<MemoGroup> & { id: string }): MemoGroup {
  return {
    sessionId: 's1',
    panel: 'free',
    label: 'グループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

function makeTlGroup(overrides: Partial<TimelineGroup> & { id: string }): TimelineGroup {
  return {
    sessionId: 's1',
    label: 'タイムライングループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

// ─── groupEntriesByMemoGroup ──────────────────────────────────────────────────

describe('groupEntriesByMemoGroup', () => {
  it('エントリをグループに振り分ける', () => {
    const groups = [makeGroup({ id: 'g1', label: 'A' })];
    const entries = [
      makeEntry({ id: 'e1', groupId: 'g1' }),
      makeEntry({ id: 'e2', groupId: 'g1' }),
    ];
    const result = groupEntriesByMemoGroup(entries, groups);
    expect(result.grouped).toHaveLength(1);
    expect(result.grouped[0].entries).toHaveLength(2);
    expect(result.uncategorized).toHaveLength(0);
  });

  it('groupId なしのエントリは未分類に入る', () => {
    const groups = [makeGroup({ id: 'g1' })];
    const entries = [
      makeEntry({ id: 'e1' }),
      makeEntry({ id: 'e2', groupId: undefined }),
    ];
    const result = groupEntriesByMemoGroup(entries, groups);
    expect(result.uncategorized).toHaveLength(2);
  });

  it('存在しないグループを指す groupId は未分類に入る', () => {
    const groups = [makeGroup({ id: 'g1' })];
    const entries = [
      makeEntry({ id: 'e1', groupId: 'deleted-group' }),
    ];
    const result = groupEntriesByMemoGroup(entries, groups);
    expect(result.uncategorized).toHaveLength(1);
    expect(result.grouped[0].entries).toHaveLength(0);
  });

  it('空グループも結果に含まれる', () => {
    const groups = [makeGroup({ id: 'g1' }), makeGroup({ id: 'g2' })];
    const entries = [makeEntry({ id: 'e1', groupId: 'g1' })];
    const result = groupEntriesByMemoGroup(entries, groups);
    expect(result.grouped).toHaveLength(2);
    expect(result.grouped[1].entries).toHaveLength(0);
  });

  it('グループ・エントリ共に空の場合', () => {
    const result = groupEntriesByMemoGroup([], []);
    expect(result.grouped).toHaveLength(0);
    expect(result.uncategorized).toHaveLength(0);
  });
});

// ─── groupEntriesByTimeline ───────────────────────────────────────────────────

describe('groupEntriesByTimeline', () => {
  it('エントリを時間帯ごとにグループ化する', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const entries = [
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', eventTimeSortKey: 540, sortOrder: 1 }), // 9:00
      makeEntry({ id: 'e2', timelineGroupId: 'tg1', eventTimeSortKey: 570, sortOrder: 2 }), // 9:30
      makeEntry({ id: 'e3', timelineGroupId: 'tg1', eventTimeSortKey: 720, sortOrder: 3 }), // 12:00
    ];
    const result = groupEntriesByTimeline(entries, groups);
    expect(result).toHaveLength(1);
    expect(result[0].hourGroups).toHaveLength(2); // 9時台と12時台
    expect(result[0].hourGroups[0].hour).toBe(9);
    expect(result[0].hourGroups[0].entries).toHaveLength(2);
    expect(result[0].hourGroups[1].hour).toBe(12);
    expect(result[0].hourGroups[1].entries).toHaveLength(1);
  });

  it('時間帯ラベルが正しく設定される', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const entries = [
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', eventTimeSortKey: 750 }), // 12:30
    ];
    const result = groupEntriesByTimeline(entries, groups);
    expect(result[0].hourGroups[0].label).toBe('12:00');
  });

  it('時間未設定のエントリは unknown に入る', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const entries = [
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', eventTimeSortKey: undefined, sortOrder: 1 }),
      makeEntry({ id: 'e2', timelineGroupId: 'tg1', eventTimeSortKey: undefined, sortOrder: 2 }),
    ];
    const result = groupEntriesByTimeline(entries, groups);
    expect(result[0].hourGroups).toHaveLength(0);
    expect(result[0].unknown).toHaveLength(2);
  });

  it('unknown 内は sortOrder 順', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const entries = [
      makeEntry({ id: 'e2', timelineGroupId: 'tg1', sortOrder: 3 }),
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', sortOrder: 1 }),
    ];
    const result = groupEntriesByTimeline(entries, groups);
    expect(result[0].unknown.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('同一時間帯内は eventTimeSortKey → sortOrder の順にソート', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const entries = [
      makeEntry({ id: 'e2', timelineGroupId: 'tg1', eventTimeSortKey: 570, sortOrder: 1 }), // 9:30
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', eventTimeSortKey: 540, sortOrder: 2 }), // 9:00
    ];
    const result = groupEntriesByTimeline(entries, groups);
    // 9:00 (540) が 9:30 (570) より前
    expect(result[0].hourGroups[0].entries.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('別グループのエントリは混在しない', () => {
    const groups = [makeTlGroup({ id: 'tg1' }), makeTlGroup({ id: 'tg2' })];
    const entries = [
      makeEntry({ id: 'e1', timelineGroupId: 'tg1', eventTimeSortKey: 540 }),
      makeEntry({ id: 'e2', timelineGroupId: 'tg2', eventTimeSortKey: 540 }),
    ];
    const result = groupEntriesByTimeline(entries, groups);
    expect(result[0].hourGroups[0].entries).toHaveLength(1);
    expect(result[1].hourGroups[0].entries).toHaveLength(1);
  });

  it('空グループの場合', () => {
    const groups = [makeTlGroup({ id: 'tg1' })];
    const result = groupEntriesByTimeline([], groups);
    expect(result[0].hourGroups).toHaveLength(0);
    expect(result[0].unknown).toHaveLength(0);
  });
});
