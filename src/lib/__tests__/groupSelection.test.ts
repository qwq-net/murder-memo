import { describe, expect, it } from 'vitest';

import { resolveGroupSelection } from '../groupSelection';
import type { MemoGroup, TimelineGroup } from '@/types/memo';

// テスト用のグループ生成ヘルパー
function tlGroup(id: string, label: string, sortOrder: number): TimelineGroup {
  return { id, sessionId: 's', label, sortOrder, collapsed: false };
}
function memoGroup(
  id: string,
  label: string,
  panel: 'free' | 'personal',
  sortOrder: number,
): MemoGroup {
  return { id, sessionId: 's', panel, label, sortOrder, collapsed: false };
}

describe('resolveGroupSelection', () => {
  describe('timeline パネル', () => {
    it('候補は timelineGroups（id/label のみ）', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0), tlGroup('t2', 'グループ2', 1)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        't2',
      );
      expect(result.candidates).toEqual([
        { id: 't1', label: 'グループ1' },
        { id: 't2', label: 'グループ2' },
      ]);
    });

    it('selectedGroupId が候補に存在すればそれを採用', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0), tlGroup('t2', 'グループ2', 1)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        't2',
      );
      expect(result.effectiveGroupId).toBe('t2');
    });

    it('selectedGroupId が候補に無ければ無効化（空文字）', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0), tlGroup('t2', 'グループ2', 1)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        'unknown',
      );
      expect(result.effectiveGroupId).toBe('');
    });

    it('グループ1件かつ未選択（無効）なら自動でその1件を選択', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        '',
      );
      expect(result.effectiveGroupId).toBe('t1');
    });

    it('グループ1件でも selectedGroupId がその1件を指していれば自動選択ロジックを通らず同じ id', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        't1',
      );
      expect(result.effectiveGroupId).toBe('t1');
    });

    it('グループ2件で未選択なら自動選択せず空文字', () => {
      const timelineGroups = [tlGroup('t1', 'グループ1', 0), tlGroup('t2', 'グループ2', 1)];
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups, memoGroups: [] },
        '',
      );
      expect(result.effectiveGroupId).toBe('');
    });

    it('グループ0件なら候補なし・空文字', () => {
      const result = resolveGroupSelection(
        'timeline',
        { timelineGroups: [], memoGroups: [] },
        't1',
      );
      expect(result.candidates).toEqual([]);
      expect(result.effectiveGroupId).toBe('');
    });
  });

  describe('メモパネル（free / personal）', () => {
    it('候補は memoGroupsForPanel と同じ並び（sortOrder 昇順・パネル一致のみ）', () => {
      const memoGroups = [
        memoGroup('m2', 'B', 'free', 1),
        memoGroup('m1', 'A', 'free', 0),
        memoGroup('mp', 'P', 'personal', 0),
      ];
      const result = resolveGroupSelection(
        'free',
        { timelineGroups: [], memoGroups },
        'm1',
      );
      expect(result.candidates).toEqual([
        { id: 'm1', label: 'A' },
        { id: 'm2', label: 'B' },
      ]);
    });

    it('selectedGroupId が候補にあればそれを採用', () => {
      const memoGroups = [memoGroup('m1', 'A', 'free', 0)];
      const result = resolveGroupSelection(
        'free',
        { timelineGroups: [], memoGroups },
        'm1',
      );
      expect(result.effectiveGroupId).toBe('m1');
    });

    it('selectedGroupId が候補に無ければ空文字', () => {
      const memoGroups = [memoGroup('m1', 'A', 'free', 0)];
      const result = resolveGroupSelection(
        'free',
        { timelineGroups: [], memoGroups },
        'other',
      );
      expect(result.effectiveGroupId).toBe('');
    });

    it('メモパネルでは1件でも自動選択しない（timeline 限定のロジック）', () => {
      const memoGroups = [memoGroup('m1', 'A', 'free', 0)];
      const result = resolveGroupSelection(
        'free',
        { timelineGroups: [], memoGroups },
        '',
      );
      expect(result.effectiveGroupId).toBe('');
    });

    it('personal パネルは personal のグループのみ候補', () => {
      const memoGroups = [
        memoGroup('mf', 'F', 'free', 0),
        memoGroup('mp', 'P', 'personal', 0),
      ];
      const result = resolveGroupSelection(
        'personal',
        { timelineGroups: [], memoGroups },
        'mp',
      );
      expect(result.candidates).toEqual([{ id: 'mp', label: 'P' }]);
      expect(result.effectiveGroupId).toBe('mp');
    });
  });
});
