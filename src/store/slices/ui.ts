import type { PanelId, PanelLayoutConfig } from '@/types/memo';
import type { StoreState } from '@/store/index';

const EMPTY_FILTER: Record<PanelId, string[]> = { free: [], personal: [], timeline: [] };

// ─── トースト ─────────────────────────────────────────────────────────────────

export type ToastType = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;

export interface UiSlice {
  layout: PanelLayoutConfig;
  activePanel: PanelId;
  highlightCharacterId: string | null;
  /** セッション初期化（IDB読込 + データ投入）が完了したか */
  isSessionReady: boolean;
  isCharacterSetupOpen: boolean;
  isSettingsOpen: boolean;
  isSessionSwitcherOpen: boolean;
  focusedEntryId: string | null;
  /** 未分類グループの折りたたみ状態（パネル別） */
  uncategorizedCollapsed: Record<string, boolean>;
  /** キャラクターフィルター（パネル別、選択中のキャラクター ID 配列） */
  characterFilter: Record<PanelId, string[]>;
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

  setLayout: (layout: Partial<PanelLayoutConfig>) => void;
  setActivePanel: (panel: PanelId) => void;
  setHighlightCharacter: (id: string | null) => void;
  setSessionReady: (ready: boolean) => void;
  setCharacterSetupOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSessionSwitcherOpen: (open: boolean) => void;
  setFocusedEntry: (id: string | null) => void;
  setUncategorizedCollapsed: (panel: string, collapsed: boolean) => void;
  toggleCharacterFilter: (panel: PanelId, characterId: string) => void;
  clearCharacterFilter: (panel: PanelId) => void;
  clearAllCharacterFilters: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setWelcomeOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  /** 初期クエリを指定して検索オーバーレイを開く */
  openSearchWith: (query: string) => void;
  setDeductionOpen: (open: boolean) => void;
  setRelationDiagramOpen: (open: boolean) => void;
}

const DEFAULT_LAYOUT: PanelLayoutConfig = {
  sizes: [33.33, 33.33, 33.34],
  order: ['free', 'timeline', 'personal'],
};

export const createUiSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
): UiSlice => ({
  layout: DEFAULT_LAYOUT,
  activePanel: 'free',
  highlightCharacterId: null,
  isSessionReady: false,
  isCharacterSetupOpen: false,
  isSettingsOpen: false,
  isSessionSwitcherOpen: false,
  focusedEntryId: null,
  uncategorizedCollapsed: {},
  characterFilter: { ...EMPTY_FILTER },
  toasts: [],
  isWelcomeOpen: false,
  isSearchOpen: false,
  searchInitialQuery: '',
  isDeductionOpen: false,
  isRelationDiagramOpen: false,

  setLayout: (patch) =>
    set((s) => ({ layout: { ...s.layout, ...patch } })),

  setActivePanel: (panel) => set(() => ({ activePanel: panel })),

  setHighlightCharacter: (id) => set(() => ({ highlightCharacterId: id })),

  setSessionReady: (ready) => set(() => ({ isSessionReady: ready })),

  setCharacterSetupOpen: (open) => set(() => ({ isCharacterSetupOpen: open })),

  setSettingsOpen: (open) => set(() => ({ isSettingsOpen: open })),

  setSessionSwitcherOpen: (open) => set(() => ({ isSessionSwitcherOpen: open })),

  setFocusedEntry: (id) => set(() => ({ focusedEntryId: id })),

  setUncategorizedCollapsed: (panel, collapsed) =>
    set((s) => ({ uncategorizedCollapsed: { ...s.uncategorizedCollapsed, [panel]: collapsed } })),

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

  clearAllCharacterFilters: () =>
    set(() => ({ characterFilter: { ...EMPTY_FILTER } })),

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: String(++toastId), message, type }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setWelcomeOpen: (open) => set(() => ({ isWelcomeOpen: open })),

  setSearchOpen: (open) => set(() => ({ isSearchOpen: open })),

  openSearchWith: (query) => set(() => ({ isSearchOpen: true, searchInitialQuery: query })),

  setDeductionOpen: (open) => set(() => ({ isDeductionOpen: open })),

  setRelationDiagramOpen: (open) => set(() => ({ isRelationDiagramOpen: open })),
});
