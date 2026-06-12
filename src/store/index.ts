import { temporal } from 'zundo';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { groupsEqualIgnoringCollapse } from '@/lib/historyEquality';
import { getEntriesBySession } from '@/lib/idb';
import { visiblePanels } from '@/lib/panelLayout';
import { selectResolvedLayout } from '@/store/selectors';
import type { CharactersSlice } from '@/store/slices/characters';
import { createCharactersSlice } from '@/store/slices/characters';
import type { DeductionsSlice } from '@/store/slices/deductions';
import { createDeductionsSlice } from '@/store/slices/deductions';
import type { EntriesSlice } from '@/store/slices/entries';
import { createEntriesSlice } from '@/store/slices/entries';
import type { LinkKeywordsSlice } from '@/store/slices/linkKeywords';
import { createLinkKeywordsSlice } from '@/store/slices/linkKeywords';
import type { MemoGroupsSlice } from '@/store/slices/memoGroups';
import { createMemoGroupsSlice } from '@/store/slices/memoGroups';
import type { RelationsSlice } from '@/store/slices/relations';
import { createRelationsSlice } from '@/store/slices/relations';
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
  DeductionsSlice &
  RelationsSlice &
  LinkKeywordsSlice &
  SettingsSlice &
  UiSlice;

/** Undo/Redo で追跡するデータ部分のみ抽出 */
type TrackedState = Pick<
  StoreState,
  'entries' | 'characters' | 'timelineGroups' | 'memoGroups' | 'deductions' | 'relations'
>;

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
      ...createLinkKeywordsSlice(set as Parameters<typeof createLinkKeywordsSlice>[0], get),
      ...createSettingsSlice(set as Parameters<typeof createSettingsSlice>[0]),
      ...createUiSlice(set as Parameters<typeof createUiSlice>[0], get),
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
      // データ配列の参照が同じなら変更なしと判定（UI 変更で履歴が積まれるのを防止）。
      // グループは折りたたみトグル（collapsed）だけの変化を Undo 対象にしないため、
      // collapsed を無視した比較を使う。
      equality: (past, current) =>
        past.entries === current.entries &&
        past.characters === current.characters &&
        groupsEqualIgnoringCollapse(past.timelineGroups, current.timelineGroups) &&
        groupsEqualIgnoringCollapse(past.memoGroups, current.memoGroups) &&
        past.deductions === current.deductions &&
        past.relations === current.relations,
      // テキスト入力を 1 操作にまとめるためのデバウンス
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (...args: Parameters<typeof handleSet>) => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            handleSet(...args);
            timeout = null;
          }, 500);
        };
      },
    },
  ),
);

// ─── 非表示パネルから activePanel を逃がす ────────────────────────────────────
//
// レイアウト変更（設定・ポップオーバー・セッション切替・検索の自動再表示）のどの経路でも、
// activePanel が非表示パネルを指したら先頭の表示パネルへ移す。モバイルのタブ UI は
// activePanel のパネルだけを描画するため、これを怠ると画面が空になる。

{
  // 起動時の初期ガード（保存済みレイアウトで activePanel 既定値が非表示の場合）
  const s = useStore.getState();
  const visible = visiblePanels(selectResolvedLayout(s));
  if (!visible.includes(s.activePanel)) s.setActivePanel(visible[0]);
}

useStore.subscribe(
  (state) => selectResolvedLayout(state),
  (layout) => {
    const { activePanel, setActivePanel } = useStore.getState();
    const visible = visiblePanels(layout);
    if (!visible.includes(activePanel)) setActivePanel(visible[0]);
  },
);

// ─── セッション切替時にエントリ・キャラクター・タイムライングループを再ロード ──

useStore.subscribe(
  (state) => state.activeSessionId,
  async (sessionId, previousSessionId) => {
    if (!sessionId) return;

    const { pause, resume, clear } = useStore.temporal.getState();

    // 初回ロード（null → 値）: initSessions() がデータを投入済みなので再読込は不要。
    // undo/redo 履歴のクリアのみ行う。
    if (previousSessionId === null) {
      pause();
      clear();
      resume();
      return;
    }

    // 通常のセッション切替: IDB からデータを読み込む
    const {
      loadCharacters,
      loadEntries,
      loadTimelineGroups,
      loadMemoGroups,
      loadDeductions,
      loadRelations,
      loadLinkKeywords,
      clearAllCharacterFilters,
      clearAllImportanceFilters,
      clearSearchInitialQuery,
      setLayoutDraft,
      setSessionReady,
      addToast,
    } = useStore.getState();
    // セッション固有の UI 状態（フィルター・検索初期クエリ・リサイズ中ドラフト）を持ち越さない
    clearAllCharacterFilters();
    clearAllImportanceFilters();
    clearSearchInitialQuery();
    setLayoutDraft(null);
    // ロード完了まで UI をローディング表示に切り替える（中途半端なデータでの操作を防ぐ）
    setSessionReady(false);
    // ロード中は履歴記録を停止（ロード操作自体を undo できないように）
    pause();
    try {
      const [entries] = await Promise.all([
        getEntriesBySession(sessionId),
        loadCharacters(sessionId),
        loadTimelineGroups(sessionId),
        loadMemoGroups(sessionId),
        loadDeductions(sessionId),
        loadRelations(sessionId),
        loadLinkKeywords(sessionId),
      ]);
      loadEntries(entries.sort((a, b) => a.sortOrder - b.sortOrder));
      clear();
    } catch (err) {
      console.error('セッション切替時のデータ読み込みに失敗しました', err);
      addToast('セッション切替に失敗しました。ページを再読み込みしてください。', 'error');
    } finally {
      resume();
      setSessionReady(true);
    }
  },
);

// ─── セレクタ ─────────────────────────────────────────────────────────────────

export const selectCharacterById = (id: string) => (s: StoreState) =>
  s.characters.find((c) => c.id === id);
