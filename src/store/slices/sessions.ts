import { nanoid } from 'nanoid';

import { clearSessionData, deleteSession, getAllSessions, putSession } from '@/lib/idb';
import type { GameSession } from '@/types/memo';
import type { StoreState } from '@/store/index';

export interface SessionsSlice {
  sessions: GameSession[];
  activeSessionId: string | null;

  initSessions: () => Promise<void>;
  createSession: (name: string) => Promise<GameSession>;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  clearCurrentSession: () => Promise<void>;
}

export const createSessionsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): SessionsSlice => ({
  sessions: [],
  activeSessionId: null,

  initSessions: async () => {
    let sessions = await getAllSessions();
    if (sessions.length === 0) {
      const first: GameSession = {
        id: nanoid(),
        name: 'セッション 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await putSession(first);
      sessions = [first];
    }
    sessions.sort((a, b) => a.createdAt - b.createdAt);
    set(() => ({
      sessions,
      activeSessionId: sessions[0].id,
    }));
  },

  createSession: async (name) => {
    const session: GameSession = {
      id: nanoid(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await putSession(session);
    set((s) => ({ sessions: [...s.sessions, session], activeSessionId: session.id }));
    return session;
  },

  switchSession: (id) => {
    set(() => ({ activeSessionId: id }));
  },

  renameSession: async (id, name) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    const updated = { ...session, name, updatedAt: Date.now() };
    await putSession(updated);
    set((s) => ({ sessions: s.sessions.map((s2) => (s2.id === id ? updated : s2)) }));
  },

  removeSession: async (id) => {
    await deleteSession(id);
    set((s) => {
      const remaining = s.sessions.filter((s2) => s2.id !== id);
      const nextActiveId =
        s.activeSessionId === id ? (remaining[0]?.id ?? null) : s.activeSessionId;
      return { sessions: remaining, activeSessionId: nextActiveId };
    });
  },

  clearCurrentSession: async () => {
    const { activeSessionId, sessions } = get();
    if (!activeSessionId) return;

    await clearSessionData(activeSessionId);

    // updatedAt を更新
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session) {
      const updated = { ...session, updatedAt: Date.now() };
      await putSession(updated);
      set((s) => ({
        sessions: s.sessions.map((s2) => (s2.id === activeSessionId ? updated : s2)),
      }));
    }

    // インメモリ状態をリセット
    set(() => ({
      entries: [],
      characters: [],
      timelineGroups: [],
      memoGroups: [],
    }));
  },
});
