import type { PanelId, PanelLayoutConfig } from '../../types/memo';
import type { StoreState } from '../index';

export interface UiSlice {
  layout: PanelLayoutConfig;
  activePanel: PanelId;
  highlightCharacterId: string | null;
  isCharacterSetupOpen: boolean;
  isSessionSwitcherOpen: boolean;
  focusedEntryId: string | null;

  setLayout: (layout: Partial<PanelLayoutConfig>) => void;
  setActivePanel: (panel: PanelId) => void;
  setHighlightCharacter: (id: string | null) => void;
  setCharacterSetupOpen: (open: boolean) => void;
  setSessionSwitcherOpen: (open: boolean) => void;
  setFocusedEntry: (id: string | null) => void;
}

const DEFAULT_LAYOUT: PanelLayoutConfig = {
  sizes: [40, 30, 30],
  order: ['free', 'timeline', 'personal'],
};

export const createUiSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
): UiSlice => ({
  layout: DEFAULT_LAYOUT,
  activePanel: 'free',
  highlightCharacterId: null,
  isCharacterSetupOpen: false,
  isSessionSwitcherOpen: false,
  focusedEntryId: null,

  setLayout: (patch) =>
    set((s) => ({ layout: { ...s.layout, ...patch } })),

  setActivePanel: (panel) => set(() => ({ activePanel: panel })),

  setHighlightCharacter: (id) => set(() => ({ highlightCharacterId: id })),

  setCharacterSetupOpen: (open) => set(() => ({ isCharacterSetupOpen: open })),

  setSessionSwitcherOpen: (open) => set(() => ({ isSessionSwitcherOpen: open })),

  setFocusedEntry: (id) => set(() => ({ focusedEntryId: id })),
});
