import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getEntriesBySession } from '../lib/idb';
import type { CharactersSlice } from './slices/characters';
import { createCharactersSlice } from './slices/characters';
import type { EntriesSlice } from './slices/entries';
import { createEntriesSlice } from './slices/entries';
import type { SessionsSlice } from './slices/sessions';
import { createSessionsSlice } from './slices/sessions';
import type { UiSlice } from './slices/ui';
import { createUiSlice } from './slices/ui';

export type StoreState = SessionsSlice & EntriesSlice & CharactersSlice & UiSlice;

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
  ...createSessionsSlice(set as Parameters<typeof createSessionsSlice>[0], get),
  ...createEntriesSlice(set as Parameters<typeof createEntriesSlice>[0], get),
  ...createCharactersSlice(set as Parameters<typeof createCharactersSlice>[0], get),
    ...createUiSlice(set as Parameters<typeof createUiSlice>[0]),
  })),
);

// ─── セッション切替時にエントリ・キャラクターを再ロード ───────────────────────

useStore.subscribe(
  (state) => state.activeSessionId,
  async (sessionId) => {
    if (!sessionId) return;
    const { loadCharacters, loadEntries } = useStore.getState();
    const [entries] = await Promise.all([
      getEntriesBySession(sessionId),
      loadCharacters(sessionId),
    ]);
    loadEntries(entries.sort((a, b) => a.sortOrder - b.sortOrder));
  },
);

// ─── セレクタ ─────────────────────────────────────────────────────────────────

export const selectEntriesByPanel = (panel: string) => (s: StoreState) =>
  s.entries
    .filter((e) => e.panel === panel)
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const selectTimelineEntries = (s: StoreState) =>
  s.entries
    .filter((e) => e.panel === 'timeline' || e.type === 'timeline')
    .sort((a, b) => {
      if (a.eventTimeSortKey != null && b.eventTimeSortKey != null)
        return a.eventTimeSortKey - b.eventTimeSortKey;
      if (a.eventTimeSortKey != null) return -1;
      if (b.eventTimeSortKey != null) return 1;
      return a.sortOrder - b.sortOrder;
    });

export const selectCharacterById = (id: string) => (s: StoreState) =>
  s.characters.find((c) => c.id === id);
