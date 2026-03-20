import { nanoid } from 'nanoid';

import {
  bulkPutMemoGroups,
  deleteMemoGroup,
  getMemoGroupsBySession,
  putMemoGroup,
} from '../../lib/idb';
import type { MemoGroup } from '../../types/memo';
import type { StoreState } from '../index';

export interface MemoGroupsSlice {
  memoGroups: MemoGroup[];

  loadMemoGroups: (sessionId: string) => Promise<void>;
  addMemoGroup: (label: string, panel: 'free' | 'personal') => Promise<MemoGroup>;
  updateMemoGroup: (id: string, patch: Partial<Pick<MemoGroup, 'label' | 'collapsed'>>) => Promise<void>;
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
    const maxOrder = panelGroups.reduce((m, g) => Math.max(m, g.sortOrder), -1);
    const group: MemoGroup = {
      id: nanoid(),
      sessionId,
      panel,
      label,
      sortOrder: maxOrder + 1,
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

  removeMemoGroup: async (id) => {
    // グループを削除時、所属エントリのgroupIdをクリア（エントリは残す → 未分類へ）
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entries = get().entries.filter((e) => e.groupId === id);
    for (const entry of entries) {
      await get().updateEntry(entry.id, { groupId: undefined });
    }
    await deleteMemoGroup(id);
    set((s) => ({
      memoGroups: s.memoGroups.filter((g) => g.id !== id),
    }));
  },

  reorderMemoGroups: async (orderedIds) => {
    const updated = get().memoGroups.map((g) => {
      const idx = orderedIds.indexOf(g.id);
      return idx === -1 ? g : { ...g, sortOrder: idx };
    });
    updated.sort((a, b) => a.sortOrder - b.sortOrder);
    await bulkPutMemoGroups(updated);
    set(() => ({ memoGroups: updated }));
  },

  toggleMemoGroupCollapse: (id) => {
    const group = get().memoGroups.find((g) => g.id === id);
    if (!group) return;
    const updated = { ...group, collapsed: !group.collapsed };
    putMemoGroup(updated);
    set((s) => ({
      memoGroups: s.memoGroups.map((g) => (g.id === id ? updated : g)),
    }));
  },
});
