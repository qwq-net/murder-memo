import { nanoid } from 'nanoid';

import { bulkPutEntries, deleteEntry, deleteImage, putEntry } from '@/lib/idb';
import type { MemoEntry, MemoEntryType, PanelId } from '@/types/memo';
import type { StoreState } from '@/store/index';

export interface EntriesSlice {
  entries: MemoEntry[];

  loadEntries: (entries: MemoEntry[]) => void;
  addEntry: (
    partial: Pick<MemoEntry, 'panel'> & Partial<Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>>,
  ) => Promise<MemoEntry>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  moveEntryToPanel: (id: string, panel: PanelId) => Promise<void>;
  reclassifyEntry: (id: string, type: MemoEntryType) => Promise<void>;
  toggleCharacterTag: (entryId: string, characterId: string) => Promise<void>;
  reorderEntries: (panel: PanelId, orderedIds: string[]) => Promise<void>;
  bulkLoadEntries: (entries: MemoEntry[], sessionId: string) => Promise<void>;
}

export const createEntriesSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): EntriesSlice => ({
  entries: [],

  loadEntries: (entries) => set(() => ({ entries })),

  addEntry: async (partial) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) throw new Error('No active session');

    const maxOrder = get().entries.reduce((m, e) => Math.max(m, e.sortOrder), -1);
    const { panel, ...rest } = partial;
    const entry: MemoEntry = {
      type: 'text',
      content: '',
      characterTags: [],
      ...rest,
      panel,
      id: nanoid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: maxOrder + 1,
    };
    // 状態を先に同期更新（後続の addEntry が正しい maxOrder を取得できるように）
    set((s) => ({ entries: [...s.entries, entry] }));
    await putEntry(entry, sessionId);
    return entry;
  },

  updateEntry: async (id, patch) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, ...patch, updatedAt: Date.now() };
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    await putEntry(updated, sessionId);
  },

  deleteEntry: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (entry?.imageBlobKey) await deleteImage(entry.imageBlobKey);
    await deleteEntry(id);
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
    }));
  },

  moveEntryToPanel: async (id, panel) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const patch: Partial<MemoEntry> = { panel, updatedAt: Date.now() };
    // タイムラインから離れる場合、グループ・時刻情報をクリア
    if (panel !== 'timeline') {
      patch.timelineGroupId = undefined;
      patch.eventTime = undefined;
      patch.eventTimeSortKey = undefined;
    }
    const updated = { ...entry, ...patch };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
  },

  reclassifyEntry: async (id, type) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, type, updatedAt: Date.now() };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
  },

  toggleCharacterTag: async (entryId, characterId) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;
    const tags = entry.characterTags.includes(characterId)
      ? entry.characterTags.filter((t) => t !== characterId)
      : [...entry.characterTags, characterId];
    const updated = { ...entry, characterTags: tags, updatedAt: Date.now() };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === entryId ? updated : e)) }));
  },

  reorderEntries: async (panel, orderedIds) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const now = Date.now();
    const changedEntries: MemoEntry[] = [];
    const updated = get().entries.map((e) => {
      const idx = orderedIds.indexOf(e.id);
      if (e.panel !== panel || idx === -1) return e;
      const reordered = { ...e, sortOrder: idx, updatedAt: now };
      changedEntries.push(reordered);
      return reordered;
    });
    // 同期的にstate更新 → DnDオーバーレイが正しい位置にアニメーションする
    set(() => ({ entries: updated }));
    // 対象パネルのエントリだけを IndexedDB に書き込む
    await bulkPutEntries(changedEntries, sessionId);
  },

  bulkLoadEntries: async (entries, sessionId) => {
    await bulkPutEntries(entries, sessionId);
    set(() => ({ entries }));
  },
});
