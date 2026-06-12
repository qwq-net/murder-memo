import { matchesEntryFilter, resolveCharacterNames } from '@/lib/entryFilter';
import { setPanelHidden } from '@/lib/panelLayout';
import type { StoreState } from '@/store/index';
import { selectResolvedLayout } from '@/store/selectors';
import type { ImportanceLevel, MemoEntry, PanelId, PanelLayout } from '@/types/memo';

const EMPTY_FILTER: Record<PanelId, string[]> = { free: [], personal: [], timeline: [] };
const EMPTY_IMPORTANCE_FILTER: Record<PanelId, ImportanceLevel[]> = {
  free: [],
  personal: [],
  timeline: [],
};

// ─── トースト ─────────────────────────────────────────────────────────────────

export type ToastType = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;

export interface UiSlice {
  /**
   * リサイズドラッグ中の一時レイアウト（メモリのみ・毎 mousemove 更新）。
   * 表示は selectResolvedLayout（store/selectors.ts）が最優先で参照し、
   * 確定（pointerup）時に commitLayoutDraft が所有レイヤーへ1回だけ書き込む。
   */
  layoutDraft: PanelLayout | null;
  /** セッション単位レイアウト編集ポップオーバーの表示状態 */
  isLayoutPopoverOpen: boolean;
  /**
   * パネルの「順番ヒント」オーバーレイ（各領域を薄暗くして①②③を表示）の発火カウンタ。
   * 0 は未発火。インクリメントのたびにオーバーレイが再表示され、一定時間後に自動で消える
   * （タイマーは表示側 panelOrderHintOverlay.tsx が持つ。連続変更では表示が延長される）。
   */
  layoutOrderHintTick: number;
  activePanel: PanelId;
  highlightCharacterId: string | null;
  /** セッション初期化（IDB読込 + データ投入）が完了したか */
  isSessionReady: boolean;
  isCharacterSetupOpen: boolean;
  isSettingsOpen: boolean;
  isSessionSwitcherOpen: boolean;
  focusedEntryId: string | null;
  /**
   * 「時刻を設定」等で編集に入る際、本文ではなく時刻入力へフォーカスしたいエントリ ID。
   * TimelineEntry が編集開始時にこれを見て時刻入力へフォーカスし、消費後にクリアする。
   */
  timeEditRequestId: string | null;
  /** 未分類グループの折りたたみ状態（パネル別） */
  uncategorizedCollapsed: Record<string, boolean>;
  /** キャラクターフィルター（パネル別、選択中のキャラクター ID 配列） */
  characterFilter: Record<PanelId, string[]>;
  /** 重要度フィルター（パネル別、表示する重要度レベル配列。空＝絞り込みなし） */
  importanceFilter: Record<PanelId, ImportanceLevel[]>;
  /** アクティブなトースト通知 */
  toasts: ToastItem[];
  /** ウェルカムモーダルの表示状態 */
  isWelcomeOpen: boolean;
  /** 検索オーバーレイの表示状態 */
  isSearchOpen: boolean;
  /** 検索オーバーレイを開く際の初期クエリ（通常検索時は空文字） */
  searchInitialQuery: string;
  /** 推理メモモーダルの表示状態 */
  isDeductionOpen: boolean;
  /** 相関図モーダルの表示状態 */
  isRelationDiagramOpen: boolean;
  /** リンク一覧モーダルの表示状態 */
  isLinkListOpen: boolean;

  setLayoutDraft: (draft: PanelLayout | null) => void;
  /** ドラッグ中の layoutDraft を所有レイヤーへ書き込み、draft をクリアする */
  commitLayoutDraft: () => Promise<void>;
  /**
   * 解決済みレイアウトの所有レイヤーへ書き込む。セッションがレイアウトを持つ
   * （= セッション固有設定中）ならセッションへ、持たない（= グローバル準拠中）なら
   * グローバル設定へ書く（プラン上の「書き込み先ルーティング」の単一実装点）。
   */
  updateResolvedLayout: (layout: PanelLayout) => Promise<void>;
  /**
   * 指定パネルが非表示なら所有レイヤーへ再表示を書き込む（検索ジャンプ時の自動再表示用。
   * revealEntry の「干渉するフィルターを自動解除する」と同じ思想）。表示中なら no-op。
   */
  ensurePanelVisible: (panel: PanelId) => void;
  setLayoutPopoverOpen: (open: boolean) => void;
  /**
   * 順番ヒントのオーバーレイを発火する（レイアウト編集で配置が実際に変わったときに呼ぶ。
   * 「なぜこの順番なのか」を画面上の位置と①②③の対応で直感的に示す）。
   */
  flashLayoutOrderHint: () => void;
  setActivePanel: (panel: PanelId) => void;
  setHighlightCharacter: (id: string | null) => void;
  setSessionReady: (ready: boolean) => void;
  setCharacterSetupOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSessionSwitcherOpen: (open: boolean) => void;
  setFocusedEntry: (id: string | null) => void;
  /** 指定エントリを編集状態にし、時刻入力へフォーカスするよう要求する（時刻トグルメニュー用） */
  requestTimeEdit: (id: string) => void;
  /** 時刻フォーカス要求を消費済みにする */
  clearTimeEditRequest: () => void;
  setUncategorizedCollapsed: (panel: string, collapsed: boolean) => void;
  /**
   * 指定エントリを画面上で可視状態にする（検索結果クリック時のスクロール前準備）。
   * 所属グループ（タイムライン/メモ/未分類）が折りたたまれていれば展開し、当該パネルの
   * キャラクターフィルターが対象エントリを隠している場合のみ解除する。スクロールは別途行う。
   */
  revealEntry: (entry: MemoEntry) => void;
  toggleCharacterFilter: (panel: PanelId, characterId: string) => void;
  clearCharacterFilter: (panel: PanelId) => void;
  clearAllCharacterFilters: () => void;
  toggleImportanceFilter: (panel: PanelId, level: ImportanceLevel) => void;
  clearImportanceFilter: (panel: PanelId) => void;
  clearAllImportanceFilters: () => void;
  /** 指定キャラを全パネルのフィルターから除去する（キャラ削除時のダングリング参照クリーンアップ用） */
  removeCharacterFromFilters: (characterId: string) => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setWelcomeOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  /** 初期クエリを指定して検索オーバーレイを開く */
  openSearchWith: (query: string) => void;
  /** 検索の初期クエリをクリアする（セッション切替時に前セッションのクエリを持ち越さないため） */
  clearSearchInitialQuery: () => void;
  setDeductionOpen: (open: boolean) => void;
  setRelationDiagramOpen: (open: boolean) => void;
  setLinkListOpen: (open: boolean) => void;
}

export const createUiSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): UiSlice => ({
  layoutDraft: null,
  isLayoutPopoverOpen: false,
  layoutOrderHintTick: 0,
  activePanel: 'free',
  highlightCharacterId: null,
  timeEditRequestId: null,
  isSessionReady: false,
  isCharacterSetupOpen: false,
  isSettingsOpen: false,
  isSessionSwitcherOpen: false,
  focusedEntryId: null,
  uncategorizedCollapsed: {},
  characterFilter: { ...EMPTY_FILTER },
  importanceFilter: { ...EMPTY_IMPORTANCE_FILTER },
  toasts: [],
  isWelcomeOpen: false,
  isSearchOpen: false,
  searchInitialQuery: '',
  isDeductionOpen: false,
  isRelationDiagramOpen: false,
  isLinkListOpen: false,

  setLayoutDraft: (draft) => set(() => ({ layoutDraft: draft })),

  commitLayoutDraft: async () => {
    const draft = get().layoutDraft;
    if (!draft) return;
    // 書き込み（楽観更新で同期反映される）→ draft クリアの順にし、
    // クリア後も resolved が同じ内容を指し続けるようにする（ちらつき防止）
    await get().updateResolvedLayout(draft);
    set(() => ({ layoutDraft: null }));
  },

  updateResolvedLayout: async (layout) => {
    const s = get();
    const session = s.sessions.find((x) => x.id === s.activeSessionId);
    if (session?.layout) {
      await s.updateSessionLayout(layout);
    } else {
      s.updateSettings({ layout });
    }
  },

  ensurePanelVisible: (panel) => {
    const s = get();
    const resolved = selectResolvedLayout(s);
    if (!resolved.hidden.includes(panel)) return;
    void s.updateResolvedLayout(setPanelHidden(resolved, panel, false));
  },

  setLayoutPopoverOpen: (open) => set(() => ({ isLayoutPopoverOpen: open })),

  flashLayoutOrderHint: () => set((s) => ({ layoutOrderHintTick: s.layoutOrderHintTick + 1 })),

  setActivePanel: (panel) => set(() => ({ activePanel: panel })),

  setHighlightCharacter: (id) => set(() => ({ highlightCharacterId: id })),

  setSessionReady: (ready) => set(() => ({ isSessionReady: ready })),

  setCharacterSetupOpen: (open) => set(() => ({ isCharacterSetupOpen: open })),

  setSettingsOpen: (open) => set(() => ({ isSettingsOpen: open })),

  setSessionSwitcherOpen: (open) => set(() => ({ isSessionSwitcherOpen: open })),

  setFocusedEntry: (id) => set(() => ({ focusedEntryId: id })),

  requestTimeEdit: (id) => set(() => ({ focusedEntryId: id, timeEditRequestId: id })),

  clearTimeEditRequest: () => set(() => ({ timeEditRequestId: null })),

  setUncategorizedCollapsed: (panel, collapsed) =>
    set((s) => ({ uncategorizedCollapsed: { ...s.uncategorizedCollapsed, [panel]: collapsed } })),

  revealEntry: (entry) => {
    const state = get();
    // 0. 所属パネルが非表示なら再表示する（非表示のままではジャンプ先が存在しない）
    state.ensurePanelVisible(entry.panel);
    // 1. 所属グループ（折りたたみ）を展開して対象を可視化する
    if (entry.panel === 'timeline') {
      const g = entry.timelineGroupId
        ? state.timelineGroups.find((tg) => tg.id === entry.timelineGroupId)
        : undefined;
      if (g?.collapsed) state.updateTimelineGroup(g.id, { collapsed: false });
    } else if (entry.groupId) {
      const g = state.memoGroups.find((mg) => mg.id === entry.groupId);
      if (g?.collapsed) state.updateMemoGroup(g.id, { collapsed: false });
    } else if (state.uncategorizedCollapsed[entry.panel]) {
      set((s) => ({
        uncategorizedCollapsed: { ...s.uncategorizedCollapsed, [entry.panel]: false },
      }));
    }
    // 2. 干渉するフィルターを解除（対象が現フィルターで非表示になる場合のみ）。
    //    判定は MemoPanel / TimelinePanel と同じ predicate（entryFilter）に揃える。
    //    キャラ・重要度それぞれ独立に、対象を隠している側のみクリアする。
    const filterIds = state.characterFilter[entry.panel];
    const importanceLevels = state.importanceFilter[entry.panel];
    const filterNames = resolveCharacterNames(state.characters, filterIds);

    if (filterIds.length > 0) {
      const visibleByChar = matchesEntryFilter(entry, {
        characterIds: filterIds,
        characterNames: filterNames,
        importanceLevels: [],
      });
      if (!visibleByChar) {
        set((s) => ({ characterFilter: { ...s.characterFilter, [entry.panel]: [] } }));
      }
    }

    if (importanceLevels.length > 0) {
      const visibleByImportance = matchesEntryFilter(entry, {
        characterIds: [],
        characterNames: [],
        importanceLevels,
      });
      if (!visibleByImportance) {
        set((s) => ({ importanceFilter: { ...s.importanceFilter, [entry.panel]: [] } }));
      }
    }
  },

  toggleCharacterFilter: (panel, characterId) =>
    set((s) => {
      const current = s.characterFilter[panel];
      const next = current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId];
      return { characterFilter: { ...s.characterFilter, [panel]: next } };
    }),

  clearCharacterFilter: (panel) =>
    set((s) => ({ characterFilter: { ...s.characterFilter, [panel]: [] } })),

  clearAllCharacterFilters: () => set(() => ({ characterFilter: { ...EMPTY_FILTER } })),

  toggleImportanceFilter: (panel, level) =>
    set((s) => {
      const current = s.importanceFilter[panel];
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      return { importanceFilter: { ...s.importanceFilter, [panel]: next } };
    }),

  clearImportanceFilter: (panel) =>
    set((s) => ({ importanceFilter: { ...s.importanceFilter, [panel]: [] } })),

  clearAllImportanceFilters: () =>
    set(() => ({ importanceFilter: { ...EMPTY_IMPORTANCE_FILTER } })),

  removeCharacterFromFilters: (characterId) =>
    set((s) => ({
      characterFilter: Object.fromEntries(
        (Object.entries(s.characterFilter) as [PanelId, string[]][]).map(([panel, ids]) => [
          panel,
          ids.filter((id) => id !== characterId),
        ]),
      ) as Record<PanelId, string[]>,
    })),

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: String(++toastId), message, type }],
    })),

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setWelcomeOpen: (open) => set(() => ({ isWelcomeOpen: open })),

  setSearchOpen: (open) => set(() => ({ isSearchOpen: open })),

  openSearchWith: (query) => set(() => ({ isSearchOpen: true, searchInitialQuery: query })),

  clearSearchInitialQuery: () => set(() => ({ searchInitialQuery: '' })),

  setDeductionOpen: (open) => set(() => ({ isDeductionOpen: open })),

  setRelationDiagramOpen: (open) => set(() => ({ isRelationDiagramOpen: open })),

  setLinkListOpen: (open) => set(() => ({ isLinkListOpen: open })),
});
