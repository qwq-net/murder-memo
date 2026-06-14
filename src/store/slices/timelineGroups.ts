import { nanoid } from 'nanoid';

import {
  bulkPutTimelineGroups,
  deleteTimelineGroupCascade,
  getTimelineGroupsBySession,
  putTimelineGroup,
} from '@/lib/idb';
import { runOptimisticUpdate } from '@/lib/optimisticRollback';
import { applyReorder, bySortOrder, nextSortOrder } from '@/lib/sortOrder';
import type { StoreState } from '@/store/index';
import type { TimelineGroup } from '@/types/memo';

export interface TimelineGroupsSlice {
  timelineGroups: TimelineGroup[];

  loadTimelineGroups: (sessionId: string) => Promise<void>;
  addTimelineGroup: (label: string) => Promise<TimelineGroup>;
  updateTimelineGroup: (
    id: string,
    patch: Partial<Pick<TimelineGroup, 'label' | 'collapsed'>>,
  ) => Promise<void>;
  removeTimelineGroup: (id: string) => Promise<void>;
  reorderTimelineGroups: (orderedIds: string[]) => Promise<void>;
  toggleTimelineGroupCollapse: (id: string) => void;
}

export const createTimelineGroupsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): TimelineGroupsSlice => ({
  timelineGroups: [],

  loadTimelineGroups: async (sessionId) => {
    const groups = await getTimelineGroupsBySession(sessionId);
    groups.sort((a, b) => a.sortOrder - b.sortOrder);
    set(() => ({ timelineGroups: groups }));
  },

  addTimelineGroup: async (label) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) throw new Error('No active session');
    const group: TimelineGroup = {
      id: nanoid(),
      sessionId,
      label,
      sortOrder: nextSortOrder(get().timelineGroups),
      collapsed: false,
    };
    await putTimelineGroup(group);
    set((s) => ({ timelineGroups: [...s.timelineGroups, group] }));
    return group;
  },

  updateTimelineGroup: async (id, patch) => {
    const group = get().timelineGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, ...patch };
    await putTimelineGroup(updated);
    set((s) => ({
      timelineGroups: s.timelineGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },

  /**
   * タイムライングループを削除する。所属エントリ（timelineGroupId 一致）も併せて削除する。
   * （メモグループの removeMemoGroup がエントリを未分類として残すのと対照的）。
   *
   * グループ削除とエントリ削除を単一トランザクション（deleteTimelineGroupCascade）で行い、
   * 途中失敗で「一部エントリだけ削除・グループ残存」という中途半端な状態を作らない。失敗時は
   * 楽観更新した state を巻き戻す。画像 blob はハード削除せず GC で回収する（Undo 復活のため）。
   */
  removeTimelineGroup: async (id) => {
    const prevEntries = get().entries;
    const prevGroups = get().timelineGroups;
    const entryIds = prevEntries.filter((e) => e.timelineGroupId === id).map((e) => e.id);
    const removedIds = new Set(entryIds);
    // 楽観更新 → 失敗時は参照ごと巻き戻す（runOptimisticUpdate に集約）
    await runOptimisticUpdate(get, set, {
      snapshot: { entries: prevEntries, timelineGroups: prevGroups },
      apply: (s) => ({
        entries: s.entries.filter((e) => !removedIds.has(e.id)),
        timelineGroups: s.timelineGroups.filter((g) => g.id !== id),
      }),
      persist: () => deleteTimelineGroupCascade(id, entryIds),
      errorMessage: 'グループの削除に失敗しました',
      logLabel: 'removeTimelineGroup',
    });
  },

  reorderTimelineGroups: async (orderedIds) => {
    // sortOrder が実際に変化したグループだけを IDB へ書き込む（reorderMemoGroups と同じく
    // 変化分のみに絞る）。state は全件を昇順に並べて反映。
    const { updated, changed } = applyReorder(get().timelineGroups, orderedIds);
    updated.sort(bySortOrder);
    await bulkPutTimelineGroups(changed);
    set(() => ({ timelineGroups: updated }));
  },

  /**
   * タイムライングループの折りたたみ状態を反転する（同期。戻り値なし）。
   * 永続化は await せず投げっぱなしにする（UI 即時反映優先。失敗はログのみ）。
   * collapsed は UI 寄り状態として Undo 履歴の対象外（historyEquality で除外）。
   */
  toggleTimelineGroupCollapse: (id) => {
    const group = get().timelineGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, collapsed: !group.collapsed };
    // 折りたたみは UI 用途で即時反映を優先するため await しないが、
    // 失敗を握り潰して unhandled rejection にしないよう catch する
    void putTimelineGroup(updated).catch((err) => {
      console.error('タイムライングループの折りたたみ状態の永続化に失敗しました', err);
    });
    set((s) => ({
      timelineGroups: s.timelineGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },
});
