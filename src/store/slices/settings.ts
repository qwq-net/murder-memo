import { DEFAULT_PANEL_LAYOUT, fromLegacyPanelOrder, normalizeLayout } from '@/lib/panelLayout';
import type { StoreState } from '@/store/index';
import type {
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  PanelId,
  PanelLayout,
} from '@/types/memo';

export interface AppSettings {
  /** 入力欄の位置: 'top' | 'bottom' */
  inputPosition: 'top' | 'bottom';
  /** 言語（将来用） */
  language: 'ja' | 'en';
  /** テーマ: auto は OS 設定に追従 */
  theme: 'dark' | 'light' | 'auto';
  /** パネルごとのデフォルト関連人物マーカー表示設定 */
  defaultCharacterDisplay: Record<
    PanelId,
    {
      format: CharacterDisplayFormat;
      visibility: CharacterDisplayVisibility;
    }
  >;
  /**
   * グローバルのパネルレイアウト。新規セッション作成時の初期値（複製して継承）であり、
   * layout 未設定のセッション（本機能導入前に作られたもの）の表示にも使われる。
   * 解決規則は store/index.ts の selectResolvedLayout を参照。
   */
  layout: PanelLayout;
}

export interface SettingsSlice {
  settings: AppSettings;
  /** ウェルカムモーダルを最後に閉じた時点のアプリバージョン */
  lastSeenVersion: string | null;

  loadSettings: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLastSeenVersion: (version: string) => void;
}

const STORAGE_KEY = 'murder-memo-settings';
const VERSION_KEY = 'murder-memo-last-seen-version';

const DEFAULT_SETTINGS: AppSettings = {
  inputPosition: 'bottom',
  language: 'ja',
  theme: 'auto',
  defaultCharacterDisplay: {
    free: { format: 'full', visibility: 'off' },
    timeline: { format: 'full', visibility: 'off' },
    personal: { format: 'full', visibility: 'off' },
  },
  layout: DEFAULT_PANEL_LAYOUT,
};

/**
 * localStorage から設定を読み込む。
 * トップレベルは DEFAULT_SETTINGS に上書きマージし、新フィールド追加時も既定値で補完される。
 * ネストした defaultCharacterDisplay は **パネルごとに** 既定値で補完する（浅いマージだと
 * パネルキーが欠けた保存値で nested オブジェクトごと上書きされ、消費側
 * `settings.defaultCharacterDisplay[panel].format` 参照が undefined アクセスでクラッシュするため）。
 * layout は normalizeLayout で必ず正当な値に救済する。保存値に layout が無い旧データは
 * 旧フィールド panelOrder（[PanelId×3]）から変換して引き継ぐ（次回 writeSettings で
 * layout として保存され、panelOrder キーは自然消滅する）。
 * 値が無い・JSON 解析に失敗した場合は DEFAULT_SETTINGS をそのまま返す（壊れた設定でも落ちない）。
 */
function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const stored = JSON.parse(raw) as Partial<AppSettings> & { panelOrder?: unknown };
    const storedDisplay: Partial<AppSettings['defaultCharacterDisplay']> =
      stored.defaultCharacterDisplay ?? {};
    const panels: PanelId[] = ['free', 'timeline', 'personal'];
    const defaultCharacterDisplay = Object.fromEntries(
      panels.map((p) => [
        p,
        { ...DEFAULT_SETTINGS.defaultCharacterDisplay[p], ...storedDisplay[p] },
      ]),
    ) as AppSettings['defaultCharacterDisplay'];
    const layout =
      stored.layout != null
        ? normalizeLayout(stored.layout)
        : (fromLegacyPanelOrder(stored.panelOrder) ?? DEFAULT_PANEL_LAYOUT);
    // 旧キー panelOrder は返却オブジェクトに持ち込まない（次回保存で localStorage からも消える）
    const { panelOrder: _legacyOrder, ...storedRest } = stored;
    void _legacyOrder;
    return { ...DEFAULT_SETTINGS, ...storedRest, defaultCharacterDisplay, layout };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export const createSettingsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
): SettingsSlice => ({
  settings: readSettings(),
  lastSeenVersion: localStorage.getItem(VERSION_KEY),

  loadSettings: () => {
    set(() => ({ settings: readSettings() }));
  },

  updateSettings: (patch) => {
    set((s) => {
      const updated = { ...s.settings, ...patch };
      writeSettings(updated);
      return { settings: updated };
    });
  },

  setLastSeenVersion: (version) => {
    localStorage.setItem(VERSION_KEY, version);
    set(() => ({ lastSeenVersion: version }));
  },
});
