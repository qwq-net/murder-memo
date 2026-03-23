import { nanoid } from 'nanoid';

import { deleteDeduction, getDeductionsBySession, putDeduction } from '@/lib/idb';
import type { CharacterDeduction } from '@/types/memo';
import type { StoreState } from '@/store/index';

export interface DeductionsSlice {
  deductions: CharacterDeduction[];

  loadDeductions: (sessionId: string) => Promise<void>;
  upsertDeduction: (characterId: string, patch: Partial<Pick<CharacterDeduction, 'suspicionLevel' | 'memo'>>) => Promise<void>;
  removeDeduction: (characterId: string) => Promise<void>;
}

export const createDeductionsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): DeductionsSlice => ({
  deductions: [],

  loadDeductions: async (sessionId) => {
    const deductions = await getDeductionsBySession(sessionId);
    set(() => ({ deductions }));
  },

  upsertDeduction: async (characterId, patch) => {
    const { activeSessionId, deductions } = get();
    if (!activeSessionId) return;

    const existing = deductions.find((d) => d.characterId === characterId);

    if (existing) {
      const updated = { ...existing, ...patch, updatedAt: Date.now() };
      await putDeduction(updated);
      set((s) => ({
        deductions: s.deductions.map((d) => (d.id === existing.id ? updated : d)),
      }));
    } else {
      const created: CharacterDeduction = {
        id: nanoid(),
        sessionId: activeSessionId,
        characterId,
        suspicionLevel: 0,
        memo: '',
        updatedAt: Date.now(),
        ...patch,
      };
      await putDeduction(created);
      set((s) => ({ deductions: [...s.deductions, created] }));
    }
  },

  removeDeduction: async (characterId) => {
    const { deductions } = get();
    const target = deductions.find((d) => d.characterId === characterId);
    if (!target) return;
    await deleteDeduction(target.id);
    set((s) => ({ deductions: s.deductions.filter((d) => d.id !== target.id) }));
  },
});
