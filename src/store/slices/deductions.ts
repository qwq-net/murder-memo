import { nanoid } from 'nanoid';

import { deleteDeduction, getDeductionsBySession, putDeduction } from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { CharacterDeduction } from '@/types/memo';

export interface DeductionsSlice {
  deductions: CharacterDeduction[];

  loadDeductions: (sessionId: string) => Promise<void>;
  upsertDeduction: (
    characterId: string,
    patch: Partial<Pick<CharacterDeduction, 'suspicionLevel' | 'memo'>>,
  ) => Promise<void>;
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

  /**
   * キャラクター単位の推理メモを作成または更新する（upsert）。
   *
   * - 同 characterId の既存があれば patch をマージし updatedAt を現在時刻に更新
   * - 無ければ suspicionLevel:0 / memo:'' を既定値として新規作成（id は自動採番）
   * - activeSessionId が無ければ何もしない（no-op）
   * - IDB へ保存し、メモリ state も同期更新する
   */
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

  /**
   * 指定キャラクターの推理メモを削除する。
   * 引数は deduction の id ではなく characterId（推理メモはキャラ1人につき最大1件のため）。
   * 該当が無ければ何もしない。キャラクター削除時のクリーンアップ（removeCharacter）からも呼ばれる。
   */
  removeDeduction: async (characterId) => {
    const { deductions } = get();
    const target = deductions.find((d) => d.characterId === characterId);
    if (!target) return;
    await deleteDeduction(target.id);
    set((s) => ({ deductions: s.deductions.filter((d) => d.id !== target.id) }));
  },
});
