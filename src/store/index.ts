import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getEntriesBySession } from '../lib/idb';
import type { CharactersSlice } from './slices/characters';
import { createCharactersSlice } from './slices/characters';
import type { EntriesSlice } from './slices/entries';
import { createEntriesSlice } from './slices/entries';
import type { MemoGroupsSlice } from './slices/memo-groups';
import { createMemoGroupsSlice } from './slices/memo-groups';
import type { SessionsSlice } from './slices/sessions';
import { createSessionsSlice } from './slices/sessions';
import type { TimelineGroupsSlice } from './slices/timeline-groups';
import { createTimelineGroupsSlice } from './slices/timeline-groups';
import type { UiSlice } from './slices/ui';
import { createUiSlice } from './slices/ui';

export type StoreState = SessionsSlice &
  EntriesSlice &
  CharactersSlice &
  TimelineGroupsSlice &
  MemoGroupsSlice &
  UiSlice;

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
  ...createSessionsSlice(set as Parameters<typeof createSessionsSlice>[0], get),
  ...createEntriesSlice(set as Parameters<typeof createEntriesSlice>[0], get),
  ...createCharactersSlice(set as Parameters<typeof createCharactersSlice>[0], get),
  ...createTimelineGroupsSlice(set as Parameters<typeof createTimelineGroupsSlice>[0], get),
  ...createMemoGroupsSlice(set as Parameters<typeof createMemoGroupsSlice>[0], get),
    ...createUiSlice(set as Parameters<typeof createUiSlice>[0]),
  })),
);

// ─── セッション切替時にエントリ・キャラクター・タイムライングループを再ロード ──

useStore.subscribe(
  (state) => state.activeSessionId,
  async (sessionId) => {
    if (!sessionId) return;
    const { loadCharacters, loadEntries, loadTimelineGroups, loadMemoGroups } = useStore.getState();
    const [entries] = await Promise.all([
      getEntriesBySession(sessionId),
      loadCharacters(sessionId),
      loadTimelineGroups(sessionId),
      loadMemoGroups(sessionId),
    ]);
    loadEntries(entries.sort((a, b) => a.sortOrder - b.sortOrder));
  },
);

// ─── セレクタ ─────────────────────────────────────────────────────────────────

export const selectCharacterById = (id: string) => (s: StoreState) =>
  s.characters.find((c) => c.id === id);
