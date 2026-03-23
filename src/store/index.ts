import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

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
import type { DeductionsSlice } from '@/store/slices/deductions';
import { createDeductionsSlice } from '@/store/slices/deductions';
import type { RelationsSlice } from '@/store/slices/relations';
import { createRelationsSlice } from '@/store/slices/relations';
import type { UiSlice } from '@/store/slices/ui';
import { createUiSlice } from '@/store/slices/ui';

export type StoreState = SessionsSlice &
  EntriesSlice &
  CharactersSlice &
  TimelineGroupsSlice &
  MemoGroupsSlice &
  DeductionsSlice &
  RelationsSlice &
  SettingsSlice &
  UiSlice;

/** Undo/Redo で追跡するデータ部分のみ抽出 */
type TrackedState = Pick<StoreState, 'entries' | 'characters' | 'timelineGroups' | 'memoGroups' | 'deductions' | 'relations'>;

export const useStore = create<StoreState>()(
  temporal(
    subscribeWithSelector((set, get) => ({
      ...createSessionsSlice(set as Parameters<typeof createSessionsSlice>[0], get),
      ...createEntriesSlice(set as Parameters<typeof createEntriesSlice>[0], get),
      ...createCharactersSlice(set as Parameters<typeof createCharactersSlice>[0], get),
      ...createTimelineGroupsSlice(set as Parameters<typeof createTimelineGroupsSlice>[0], get),
      ...createMemoGroupsSlice(set as Parameters<typeof createMemoGroupsSlice>[0], get),
      ...createDeductionsSlice(set as Parameters<typeof createDeductionsSlice>[0], get),
      ...createRelationsSlice(set as Parameters<typeof createRelationsSlice>[0], get),
      ...createSettingsSlice(set as Parameters<typeof createSettingsSlice>[0]),
      ...createUiSlice(set as Parameters<typeof createUiSlice>[0]),
    })),
    {
      partialize: (state): TrackedState => ({
        entries: state.entries,
        characters: state.characters,
        timelineGroups: state.timelineGroups,
        memoGroups: state.memoGroups,
        deductions: state.deductions,
        relations: state.relations,
      }),
      limit: 50,
      // データ配列の参照が同じなら変更なしと判定（UI 変更で履歴が積まれるのを防止）
      equality: (past, current) =>
        past.entries === current.entries &&
        past.characters === current.characters &&
        past.timelineGroups === current.timelineGroups &&
        past.memoGroups === current.memoGroups &&
        past.deductions === current.deductions &&
        past.relations === current.relations,
      // テキスト入力を 1 操作にまとめるためのデバウンス
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (state, replace, currentState, delta) => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            handleSet(state, replace, currentState, delta);
            timeout = null;
          }, 500);
        };
      },
    },
  ),
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
    const { loadCharacters, loadEntries, loadTimelineGroups, loadMemoGroups, loadDeductions, loadRelations, clearAllCharacterFilters } =
      useStore.getState();
    clearAllCharacterFilters();
    const [entries] = await Promise.all([
      getEntriesBySession(sessionId),
      loadCharacters(sessionId),
      loadTimelineGroups(sessionId),
      loadMemoGroups(sessionId),
      loadDeductions(sessionId),
      loadRelations(sessionId),
    ]);
    loadEntries(entries.sort((a, b) => a.sortOrder - b.sortOrder));
    // データロード完了後に Undo 履歴をクリア（ロード自体を undo できないように）
    useStore.temporal.getState().clear();
  },
);

// ─── セレクタ ─────────────────────────────────────────────────────────────────

export const selectCharacterById = (id: string) => (s: StoreState) =>
  s.characters.find((c) => c.id === id);
