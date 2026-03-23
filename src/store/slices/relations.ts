import { nanoid } from 'nanoid';

import { deleteRelation, getRelationsBySession, putRelation } from '@/lib/idb';
import type { CharacterRelation } from '@/types/memo';
import type { StoreState } from '@/store/index';

export interface RelationsSlice {
  relations: CharacterRelation[];

  loadRelations: (sessionId: string) => Promise<void>;
  addRelation: (partial: Omit<CharacterRelation, 'id' | 'sessionId' | 'sortOrder'>) => Promise<CharacterRelation>;
  updateRelation: (id: string, patch: Partial<Pick<CharacterRelation, 'label' | 'color' | 'memo'>>) => Promise<void>;
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

  addRelation: async (partial) => {
    const { activeSessionId, relations } = get();
    if (!activeSessionId) throw new Error('No active session');

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
