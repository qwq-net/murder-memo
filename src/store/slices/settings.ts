import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';
import type { StoreState } from '@/store/index';

export interface AppSettings {
  /** 入力欄の位置: 'top' | 'bottom' */
  inputPosition: 'top' | 'bottom';
  /** 言語（将来用） */
  language: 'ja' | 'en';
  /** テーマ（将来用） */
  theme: 'dark' | 'light';
  /** パネルごとのデフォルト関連人物マーカー表示設定 */
  defaultCharacterDisplay: Record<PanelId, {
    format: CharacterDisplayFormat;
    visibility: CharacterDisplayVisibility;
  }>;
  /** パネルの表示順 */
  panelOrder: [PanelId, PanelId, PanelId];
}

export interface SettingsSlice {
  settings: AppSettings;

  loadSettings: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const STORAGE_KEY = 'murder-memo-settings';

const DEFAULT_SETTINGS: AppSettings = {
  inputPosition: 'bottom',
  language: 'ja',
  theme: 'dark',
  defaultCharacterDisplay: {
    free:     { format: 'full', visibility: 'minimal' },
    timeline: { format: 'full', visibility: 'minimal' },
    personal: { format: 'full', visibility: 'off' },
  },
  panelOrder: ['free', 'timeline', 'personal'],
};

function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
});
