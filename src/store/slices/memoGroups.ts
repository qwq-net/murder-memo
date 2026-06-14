import { nanoid } from 'nanoid';

import {
  bulkPutMemoGroups,
  getMemoGroupsBySession,
  putMemoGroup,
  reassignMemoGroupAndDelete,
} from '@/lib/idb';
import { runOptimisticUpdate } from '@/lib/optimisticRollback';
import { applyReorder, bySortOrder, nextSortOrder } from '@/lib/sortOrder';
import type { StoreState } from '@/store/index';
import type { MemoGroup } from '@/types/memo';

export interface MemoGroupsSlice {
  memoGroups: MemoGroup[];

  loadMemoGroups: (sessionId: string) => Promise<void>;
  addMemoGroup: (label: string, panel: 'free' | 'personal') => Promise<MemoGroup>;
  updateMemoGroup: (
    id: string,
    patch: Partial<Pick<MemoGroup, 'label' | 'collapsed'>>,
  ) => Promise<void>;
  removeMemoGroup: (id: string) => Promise<void>;
  reorderMemoGroups: (orderedIds: string[]) => Promise<void>;
  toggleMemoGroupCollapse: (id: string) => void;
}

export const createMemoGroupsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): MemoGroupsSlice => ({
  memoGroups: [],

  loadMemoGroups: async (sessionId) => {
    const groups = await getMemoGroupsBySession(sessionId);
    groups.sort((a, b) => a.sortOrder - b.sortOrder);
    set(() => ({ memoGroups: groups }));
  },

  addMemoGroup: async (label, panel) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) throw new Error('No active session');
    const panelGroups = get().memoGroups.filter((g) => g.panel === panel);
    const group: MemoGroup = {
      id: nanoid(),
      sessionId,
      panel,
      label,
      sortOrder: nextSortOrder(panelGroups),
      collapsed: false,
    };
    await putMemoGroup(group);
    set((s) => ({ memoGroups: [...s.memoGroups, group] }));
    return group;
  },

  updateMemoGroup: async (id, patch) => {
    const group = get().memoGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, ...patch };
    await putMemoGroup(updated);
    set((s) => ({
      memoGroups: s.memoGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },

  /**
   * メモグループを削除する。所属エントリは削除せず、groupId をクリアして「未分類」へ移す。
   * （タイムライングループの removeTimelineGroup が所属エントリごと削除するのと対照的）。
   *
   * エントリの未分類化（groupId クリア）とグループ削除を単一トランザクション
   * （reassignMemoGroupAndDelete）で行い、途中失敗で「エントリは未分類化されたのにグループが残る」
   * 等の不整合を作らない。失敗時は楽観更新した state を巻き戻す。activeSessionId が無ければ no-op。
   */
  removeMemoGroup: async (id) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prevEntries = get().entries;
    const prevGroups = get().memoGroups;
    const now = Date.now();
    const reassigned = prevEntries
      .filter((e) => e.groupId === id)
      .map((e) => ({ ...e, groupId: undefined, updatedAt: now }));
    const reassignedById = new Map(reassigned.map((e) => [e.id, e]));
    // 楽観更新 → 失敗時は参照ごと巻き戻す（runOptimisticUpdate に集約）
    await runOptimisticUpdate(get, set, {
      snapshot: { entries: prevEntries, memoGroups: prevGroups },
      apply: (s) => ({
        entries: s.entries.map((e) => reassignedById.get(e.id) ?? e),
        memoGroups: s.memoGroups.filter((g) => g.id !== id),
      }),
      persist: () => reassignMemoGroupAndDelete(id, reassigned, sessionId),
      errorMessage: 'グループの削除に失敗しました',
      logLabel: 'removeMemoGroup',
    });
  },

  reorderMemoGroups: async (orderedIds) => {
    // sortOrder が実際に変化したグループだけを IDB へ書き込む（free/personal 両パネル分を
    // 毎回全件 put するのは無駄。reorderEntries と同じく変化分のみに絞る）。state は全件を反映。
    const { updated, changed } = applyReorder(get().memoGroups, orderedIds);
    updated.sort(bySortOrder);
    await bulkPutMemoGroups(changed);
    set(() => ({ memoGroups: updated }));
  },

  /**
   * メモグループの折りたたみ状態を反転する（同期。戻り値なし）。
   * 永続化は await せず投げっぱなしにする（UI 即時反映優先。失敗はログのみ）。
   * collapsed は UI 寄り状態として Undo 履歴の対象外（historyEquality で除外）。
   */
  toggleMemoGroupCollapse: (id) => {
    const group = get().memoGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, collapsed: !group.collapsed };
    // 折りたたみは UI 用途で即時反映を優先するため await しないが、
    // 失敗を握り潰して unhandled rejection にしないよう catch する
    void putMemoGroup(updated).catch((err) => {
      console.error('メモグループの折りたたみ状態の永続化に失敗しました', err);
    });
    set((s) => ({
      memoGroups: s.memoGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },
});
