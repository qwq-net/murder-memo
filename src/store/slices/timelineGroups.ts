import { nanoid } from 'nanoid';

import {
  bulkPutTimelineGroups,
  deleteTimelineGroup,
  getTimelineGroupsBySession,
  putTimelineGroup,
} from '@/lib/idb';
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
    const maxOrder = get().timelineGroups.reduce((m, g) => Math.max(m, g.sortOrder), -1);
    const group: TimelineGroup = {
      id: nanoid(),
      sessionId,
      label,
      sortOrder: maxOrder + 1,
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
   * 各エントリは deleteEntry 経由で消すため、画像エントリの blob も連動削除される。
   */
  removeTimelineGroup: async (id) => {
    // グループに所属するエントリも削除
    const entries = get().entries.filter((e) => e.timelineGroupId === id);
    for (const entry of entries) {
      await get().deleteEntry(entry.id);
    }
    await deleteTimelineGroup(id);
    set((s) => ({
      timelineGroups: s.timelineGroups.filter((g) => g.id !== id),
    }));
  },

  reorderTimelineGroups: async (orderedIds) => {
    const updated = get().timelineGroups.map((g) => {
      const idx = orderedIds.indexOf(g.id);
      return idx === -1 ? g : { ...g, sortOrder: idx };
    });
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    await bulkPutTimelineGroups(updated);
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
