import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { getEntriesBySession } from '@/lib/idb';
import type { CharactersSlice } from '@/store/slices/characters';
import { createCharactersSlice } from '@/store/slices/characters';
import type { EntriesSlice } from '@/store/slices/entries';
import { createEntriesSlice } from '@/store/slices/entries';
import type { MemoGroupsSlice } from '@/store/slices/memoGroups';
import { createMemoGroupsSlice } from '@/store/slices/memoGroups';
import type { SessionsSlice } from '@/store/slices/sessions';
import { createSessionsSlice } from '@/store/slices/sessions';
import type { SettingsSlice } from '@/store/slices/settings';
import { createSettingsSlice } from '@/store/slices/settings';
import type { TimelineGroupsSlice } from '@/store/slices/timelineGroups';
import { createTimelineGroupsSlice } from '@/store/slices/timelineGroups';
import type { UiSlice } from '@/store/slices/ui';
import { createUiSlice } from '@/store/slices/ui';

export type StoreState = SessionsSlice &
  EntriesSlice &
  CharactersSlice &
  TimelineGroupsSlice &
  MemoGroupsSlice &
  SettingsSlice &
  UiSlice;

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
  ...createSessionsSlice(set as Parameters<typeof createSessionsSlice>[0], get),
  ...createEntriesSlice(set as Parameters<typeof createEntriesSlice>[0], get),
  ...createCharactersSlice(set as Parameters<typeof createCharactersSlice>[0], get),
  ...createTimelineGroupsSlice(set as Parameters<typeof createTimelineGroupsSlice>[0], get),
  ...createMemoGroupsSlice(set as Parameters<typeof createMemoGroupsSlice>[0], get),
  ...createSettingsSlice(set as Parameters<typeof createSettingsSlice>[0]),
    ...createUiSlice(set as Parameters<typeof createUiSlice>[0]),
  })),
);

// ─── 設定のパネル順を layout.order に反映 ─────────────────────────────────────

// 初期同期
{
  const { settings, setLayout } = useStore.getState();
  if (settings.panelOrder) {
    setLayout({ order: settings.panelOrder });
  }
}

// 設定変更時の同期
useStore.subscribe(
  (state) => state.settings.panelOrder,
  (panelOrder) => {
    if (panelOrder) {
      useStore.getState().setLayout({ order: panelOrder });
    }
  },
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
