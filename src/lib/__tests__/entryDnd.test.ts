import { describe, expect, it } from 'vitest';

import type { MemoEntry, TimelineGroup } from '@/types/memo';
import {
  TIMELINE_UNASSIGNED_CONTAINER_ID,
  computeReorderedIds,
  entryContainerId,
  memoContainerId,
  parseContainerId,
  planEntryMove,
  resolveDropTarget,
  timelineHourContainerId,
  timelineUnknownContainerId,
} from '../entryDnd';

function entry(o: Partial<MemoEntry> & Pick<MemoEntry, 'id'>): MemoEntry {
  return {
    type: 'text',
    content: '',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    ...o,
  };
}

const byId = (entries: MemoEntry[]) => new Map(entries.map((e) => [e.id, e]));

describe('コンテナ id の生成・解析', () => {
  it('メモ列 id を往復できる（未分類含む）', () => {
    expect(parseContainerId(memoContainerId('free', 'g1'))).toEqual({
      kind: 'memo',
      panel: 'free',
      groupId: 'g1',
    });
    expect(parseContainerId(memoContainerId('personal', undefined))).toEqual({
      kind: 'memo',
      panel: 'personal',
      groupId: undefined,
    });
  });

  it('タイムライン列 id（時間帯 / 不明）を往復できる', () => {
    expect(parseContainerId(timelineHourContainerId('tg-1', 13))).toEqual({
      kind: 'timeline',
      timelineGroupId: 'tg-1',
      hour: 13,
    });
    expect(parseContainerId(timelineUnknownContainerId('tg-1'))).toEqual({
      kind: 'timeline',
      timelineGroupId: 'tg-1',
      hour: 'unknown',
    });
  });

  it('カード id（命名規約外）は null を返す', () => {
    expect(parseContainerId('abc123')).toBeNull();
  });

  it('タイムラインの「未分類」列 id は命名規約外（ドロップ先に解決されない契約）', () => {
    // 未分類列はドラッグ元としてのみ機能する。万一ドロップ解決に渡っても
    // parse が null を返して no-op になることを保証する
    expect(parseContainerId(TIMELINE_UNASSIGNED_CONTAINER_ID)).toBeNull();
  });

  it('entryContainerId はエントリの所属コンテナを返す', () => {
    expect(entryContainerId(entry({ id: 'a', panel: 'free', groupId: 'g1' }))).toBe(
      memoContainerId('free', 'g1'),
    );
    expect(
      entryContainerId(
        entry({ id: 'b', panel: 'timeline', timelineGroupId: 'tg-1', eventTimeSortKey: 800 }),
      ),
    ).toBe(timelineHourContainerId('tg-1', 13));
    expect(entryContainerId(entry({ id: 'c', panel: 'timeline', timelineGroupId: 'tg-1' }))).toBe(
      timelineUnknownContainerId('tg-1'),
    );
  });
});

describe('resolveDropTarget', () => {
  const entries = [entry({ id: 'a', panel: 'free', groupId: 'g1' })];
  it('over がコンテナ id ならそのコンテナ・overEntryId=null', () => {
    const r = resolveDropTarget(memoContainerId('free', 'g2'), byId(entries));
    expect(r?.container).toEqual({ kind: 'memo', panel: 'free', groupId: 'g2' });
    expect(r?.overEntryId).toBeNull();
  });
  it('over がカード id ならそのカードのコンテナ・overEntryId=カード', () => {
    const r = resolveDropTarget('a', byId(entries));
    expect(r?.containerId).toBe(memoContainerId('free', 'g1'));
    expect(r?.overEntryId).toBe('a');
  });
  it('未知の id は null', () => {
    expect(resolveDropTarget('zzz', byId(entries))).toBeNull();
  });
});

describe('computeReorderedIds', () => {
  const containerOf = (map: Record<string, string>) => (id: string) => map[id] ?? null;

  it('同一コンテナ内で下方向ドラッグは over の直後に挿入（arrayMove 相当）', () => {
    const ids = computeReorderedIds({
      panelOrderedIds: ['a', 'b', 'c', 'd'],
      activeId: 'a',
      targetContainerId: 'X',
      overEntryId: 'c',
      containerOf: containerOf({ a: 'X', b: 'X', c: 'X', d: 'X' }),
    });
    expect(ids).toEqual(['b', 'c', 'a', 'd']);
  });

  it('同一コンテナ内で上方向ドラッグは over の直前に挿入', () => {
    const ids = computeReorderedIds({
      panelOrderedIds: ['a', 'b', 'c', 'd'],
      activeId: 'd',
      targetContainerId: 'X',
      overEntryId: 'b',
      containerOf: containerOf({ a: 'X', b: 'X', c: 'X', d: 'X' }),
    });
    expect(ids).toEqual(['a', 'd', 'b', 'c']);
  });

  it('別コンテナのカードへドロップすると over の直前へ（active は元の並びに居ない扱い）', () => {
    const ids = computeReorderedIds({
      panelOrderedIds: ['a', 'b', 'c'],
      activeId: 'c',
      targetContainerId: 'Y',
      overEntryId: 'a',
      containerOf: containerOf({ a: 'Y', b: 'X', c: 'X' }),
    });
    // c を a の直前へ（c は X→Y へ移動）
    expect(ids).toEqual(['c', 'a', 'b']);
  });

  it('コンテナ背景（overEntryId=null）へは同コンテナ末尾へ挿入', () => {
    const ids = computeReorderedIds({
      panelOrderedIds: ['a', 'b', 'c', 'd'],
      activeId: 'd',
      targetContainerId: 'X',
      overEntryId: null,
      containerOf: containerOf({ a: 'X', b: 'X', c: 'Y', d: 'Y' }),
    });
    // X コンテナの末尾（b の直後）へ
    expect(ids).toEqual(['a', 'b', 'd', 'c']);
  });

  it('空コンテナ背景へは全体末尾へ', () => {
    const ids = computeReorderedIds({
      panelOrderedIds: ['a', 'b'],
      activeId: 'a',
      targetContainerId: 'EMPTY',
      overEntryId: null,
      containerOf: containerOf({ a: 'X', b: 'X' }),
    });
    expect(ids).toEqual(['b', 'a']);
  });
});

describe('planEntryMove', () => {
  it('メモグループ間移動: groupId とパネル全体の orderedIds を返す', () => {
    const entries = [
      entry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 }),
      entry({ id: 'b', panel: 'free', groupId: 'g2', sortOrder: 1 }),
    ];
    const move = planEntryMove({
      activeId: 'a',
      overId: 'b',
      entries,
      timelineGroups: [],
    });
    expect(move?.panel).toBe('free');
    expect(move?.groupId).toBe('g2');
    // a を b（下方向）へドロップ → b の直後に挿入
    expect(move?.orderedIds).toEqual(['b', 'a']);
  });

  it('未分類列（コンテナ背景）への移動: groupId=undefined', () => {
    const entries = [entry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 })];
    const move = planEntryMove({
      activeId: 'a',
      overId: memoContainerId('free', undefined),
      entries,
      timelineGroups: [],
    });
    expect(move?.groupId).toBeUndefined();
  });

  it('タイムラインの時間帯間移動: 隣接カードの時刻を継承する', () => {
    const tg: TimelineGroup = {
      id: 'tg-1',
      sessionId: 's',
      label: '当日',
      sortOrder: 0,
      collapsed: false,
    };
    const entries = [
      entry({
        id: 'a',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '9:00',
        eventTimeSortKey: 540,
        sortOrder: 0,
      }),
      entry({
        id: 'b',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '13:30',
        eventTimeSortKey: 810,
        sortOrder: 1,
      }),
    ];
    const move = planEntryMove({ activeId: 'a', overId: 'b', entries, timelineGroups: [tg] });
    expect(move?.panel).toBe('timeline');
    expect(move?.timelineGroupId).toBe('tg-1');
    expect(move?.eventTime).toBe('13:30');
    expect(move?.eventTimeSortKey).toBe(810);
  });

  it('別 TLグループの不明列へ移動: timelineGroupId 変更 + 時刻クリア', () => {
    const groups: TimelineGroup[] = [
      { id: 'tg-1', sessionId: 's', label: '当日', sortOrder: 0, collapsed: false },
      { id: 'tg-2', sessionId: 's', label: '前日', sortOrder: 1, collapsed: false },
    ];
    const entries = [
      entry({
        id: 'a',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '9:00',
        eventTimeSortKey: 540,
      }),
    ];
    const move = planEntryMove({
      activeId: 'a',
      overId: timelineUnknownContainerId('tg-2'),
      entries,
      timelineGroups: groups,
    });
    expect(move?.timelineGroupId).toBe('tg-2');
    expect(move?.eventTime).toBeUndefined();
    expect(move?.eventTimeSortKey).toBeUndefined();
  });

  it('自分自身へのドロップは null（no-op）', () => {
    const entries = [entry({ id: 'a', panel: 'free' })];
    expect(planEntryMove({ activeId: 'a', overId: 'a', entries, timelineGroups: [] })).toBeNull();
  });

  it('未分類（孤児）のエントリをグループ内カードへのドロップで救出できる', () => {
    const tg: TimelineGroup = {
      id: 'tg-1',
      sessionId: 's',
      label: '当日',
      sortOrder: 0,
      collapsed: false,
    };
    const entries = [
      // どのグループにも属さない孤児（インポートデータ等由来）
      entry({ id: 'orphan', panel: 'timeline', timelineGroupId: undefined, sortOrder: 5 }),
      entry({
        id: 'b',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '9:00',
        eventTimeSortKey: 540,
        sortOrder: 0,
      }),
    ];
    const move = planEntryMove({ activeId: 'orphan', overId: 'b', entries, timelineGroups: [tg] });
    expect(move?.panel).toBe('timeline');
    expect(move?.timelineGroupId).toBe('tg-1');
    // 表示順（グループ→時間帯）に含まれない孤児でも orderedIds に組み込まれる
    expect(move?.orderedIds).toContain('orphan');
  });

  it('孤児カードへのドロップは解決不能で null（孤児を意図的に作れない）', () => {
    const tg: TimelineGroup = {
      id: 'tg-1',
      sessionId: 's',
      label: '当日',
      sortOrder: 0,
      collapsed: false,
    };
    const entries = [
      entry({ id: 'orphan', panel: 'timeline', timelineGroupId: undefined }),
      entry({ id: 'b', panel: 'timeline', timelineGroupId: 'tg-1' }),
    ];
    expect(
      planEntryMove({ activeId: 'b', overId: 'orphan', entries, timelineGroups: [tg] }),
    ).toBeNull();
  });
});
