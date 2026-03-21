import { nanoid } from 'nanoid';

import {
  bulkPutTimelineGroups,
  deleteTimelineGroup,
  getTimelineGroupsBySession,
  putTimelineGroup,
} from '../../lib/idb';
import type { TimelineGroup } from '../../types/memo';
import type { StoreState } from '../index';

export interface TimelineGroupsSlice {
  timelineGroups: TimelineGroup[];

  loadTimelineGroups: (sessionId: string) => Promise<void>;
  addTimelineGroup: (label: string) => Promise<TimelineGroup>;
  updateTimelineGroup: (id: string, patch: Partial<Pick<TimelineGroup, 'label' | 'collapsed'>>) => Promise<void>;
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

  toggleTimelineGroupCollapse: (id) => {
    const group = get().timelineGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, collapsed: !group.collapsed };
    // 非同期で永続化（結果を待たない）
    putTimelineGroup(updated);
    set((s) => ({
      timelineGroups: s.timelineGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },
});
