import { nanoid } from 'nanoid';

import { deleteRelation, getRelationsBySession, putRelation } from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { CharacterRelation } from '@/types/memo';

export interface RelationsSlice {
  relations: CharacterRelation[];

  loadRelations: (sessionId: string) => Promise<void>;
  addRelation: (
    partial: Omit<CharacterRelation, 'id' | 'sessionId' | 'sortOrder'>,
  ) => Promise<CharacterRelation>;
  updateRelation: (
    id: string,
    patch: Partial<Pick<CharacterRelation, 'label' | 'color' | 'memo'>>,
  ) => Promise<void>;
  removeRelation: (id: string) => Promise<void>;
}

export const createRelationsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): RelationsSlice => ({
  relations: [],

  loadRelations: async (sessionId) => {
    const relations = await getRelationsBySession(sessionId);
    set(() => ({ relations: relations.sort((a, b) => a.sortOrder - b.sortOrder) }));
  },

  /**
   * 相関図の関係線を追加する。sortOrder は既存の最大+1、id / sessionId は自動付与。
   * activeSessionId が無ければ throw する。自己参照（from === to）も throw する
   * （UI でも抑止済みだが、点に潰れる無意味な線を防ぐ防御。複数ラベルの同一ペアは許容）。
   * IDB へ保存し、生成した関係を返す。
   */
  addRelation: async (partial) => {
    const { activeSessionId, relations } = get();
    if (!activeSessionId) throw new Error('No active session');
    if (partial.fromCharacterId === partial.toCharacterId) {
      throw new Error('自己参照の関係は作成できません');
    }

    const maxOrder = relations.reduce((m, r) => Math.max(m, r.sortOrder), -1);
    const relation: CharacterRelation = {
      id: nanoid(),
      sessionId: activeSessionId,
      sortOrder: maxOrder + 1,
      ...partial,
    };
    await putRelation(relation);
    set((s) => ({ relations: [...s.relations, relation] }));
    return relation;
  },

  updateRelation: async (id, patch) => {
    const { relations } = get();
    const target = relations.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, ...patch };
    await putRelation(updated);
    set((s) => ({ relations: s.relations.map((r) => (r.id === id ? updated : r)) }));
  },

  removeRelation: async (id) => {
    await deleteRelation(id);
    set((s) => ({ relations: s.relations.filter((r) => r.id !== id) }));
  },
});
