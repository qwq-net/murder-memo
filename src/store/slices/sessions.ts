import { nanoid } from 'nanoid';

import { buildDemoSession } from '@/lib/demoData';
import {
  bulkPutCharacters,
  bulkPutDeductions,
  bulkPutEntries,
  bulkPutLinkKeywords,
  bulkPutMemoGroups,
  bulkPutRelations,
  bulkPutTimelineGroups,
  clearSessionData,
  deleteSession,
  getAllSessions,
  getCharactersBySession,
  getDeductionsBySession,
  getEntriesBySession,
  getLinkKeywordsBySession,
  getMemoGroupsBySession,
  getRelationsBySession,
  getTimelineGroupsBySession,
  putSession,
} from '@/lib/idb';
import { APP_VERSION } from '@/lib/version';
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

const LAST_SESSION_KEY = 'murder-memo-last-session-id';

export const createSessionsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): SessionsSlice => {
  // StrictMode 等による多重呼び出しを防止
  let initPromise: Promise<void> | null = null;

  return {
    sessions: [],
    activeSessionId: null,

    initSessions: () => {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        try {
          const sessions = await getAllSessions();

          // デモセッションの確認: 未作成 or バージョン不一致なら（再）作成
          let demoData: Awaited<ReturnType<typeof buildDemoSession>> | null = null;
          const existingDemo = sessions.find((s) => s.isDemo);
          const needsDemoRefresh = !existingDemo || existingDemo.demoVersion !== APP_VERSION;

          if (needsDemoRefresh) {
            // 古いデモがあれば関連データごと削除
            if (existingDemo) {
              await deleteSession(existingDemo.id);
              sessions.splice(sessions.indexOf(existingDemo), 1);
            }

            demoData = await buildDemoSession();
            // 各オブジェクトストアは独立しているため並列書き込み
            await Promise.all([
              putSession(demoData.session),
              bulkPutCharacters(demoData.characters, demoData.session.id),
              bulkPutTimelineGroups(demoData.timelineGroups),
              bulkPutMemoGroups(demoData.memoGroups),
              bulkPutEntries(demoData.entries, demoData.session.id),
              bulkPutDeductions(demoData.deductions),
              bulkPutRelations(demoData.relations),
              bulkPutLinkKeywords(demoData.linkKeywords, demoData.session.id),
            ]);
            sessions.push(demoData.session);
          }

          sessions.sort((a, b) => a.createdAt - b.createdAt);

          // 直前に開いていたセッションを復元。存在しなければ先頭（最古）にフォールバック
          const lastId = localStorage.getItem(LAST_SESSION_KEY);
          const initialId =
            lastId && sessions.some((s) => s.id === lastId) ? lastId : sessions[0].id;

          // 初期セッションのデータをロードし、ストアに一括投入する。
          // subscriber の二重 IO を防ぐため、ここでデータを直接セットする。
          let entries,
            characters,
            timelineGroups,
            memoGroups,
            deductions,
            relations,
            linkKeywords;

          if (demoData && demoData.session.id === initialId) {
            // デモデータ作成直後: メモリ上のデータをそのまま使う（IDB 再読込不要）
            entries = demoData.entries.sort((a, b) => a.sortOrder - b.sortOrder);
            characters = demoData.characters;
            timelineGroups = demoData.timelineGroups;
            memoGroups = demoData.memoGroups;
            deductions = demoData.deductions;
            relations = demoData.relations;
            linkKeywords = demoData.linkKeywords;
          } else {
            // 既存セッション: IDB から並列読み込み
            [entries, characters, timelineGroups, memoGroups, deductions, relations, linkKeywords] =
              await Promise.all([
                getEntriesBySession(initialId).then((e) =>
                  e.sort((a, b) => a.sortOrder - b.sortOrder),
                ),
                getCharactersBySession(initialId),
                getTimelineGroupsBySession(initialId),
                getMemoGroupsBySession(initialId),
                getDeductionsBySession(initialId),
                getRelationsBySession(initialId),
                getLinkKeywordsBySession(initialId),
              ]);
            relations = relations.sort((a, b) => a.sortOrder - b.sortOrder);
          }

          // 全 IDB 書き込み・読み込みが完了してから一括で state 投入する。
          // 途中で失敗するとここまで来ないので、ストアが中途半端な状態にならない。
          set(() => ({
            sessions,
            activeSessionId: initialId,
            entries,
            characters,
            timelineGroups,
            memoGroups,
            deductions,
            relations,
            linkKeywords,
            isSessionReady: true,
          }));
        } catch (err) {
          // IDB のマイグレーション失敗・デモ投入失敗など、致命的エラーをユーザーに通知。
          // ローディング画面で固まらないよう、UI を出して再操作可能な状態にする。
          console.error('セッション初期化に失敗しました', err);
          get().addToast(
            'データの読み込みに失敗しました。ページを再読み込みしてください。',
            'error',
          );
          // 初期化リトライ可能にするため Promise キャッシュをクリア
          initPromise = null;
          // 初期化途中の中途半端な状態でも UI が出るよう ready フラグだけ立てる
          set(() => ({ isSessionReady: true }));
        }
      })();
      return initPromise;
    },

    createSession: async (name) => {
      const session: GameSession = {
        id: nanoid(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await putSession(session);
      localStorage.setItem(LAST_SESSION_KEY, session.id);
      set((s) => ({ sessions: [...s.sessions, session], activeSessionId: session.id }));
      return session;
    },

    switchSession: (id) => {
      localStorage.setItem(LAST_SESSION_KEY, id);
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
      // デモセッションは削除不可
      const session = get().sessions.find((s) => s.id === id);
      if (session?.isDemo) return;

      await deleteSession(id);
      set((s) => {
        const remaining = s.sessions.filter((s2) => s2.id !== id);
        const nextActiveId =
          s.activeSessionId === id ? (remaining[0]?.id ?? null) : s.activeSessionId;
        // 削除されたセッションが最終開封セッションとして保存されていればクリア
        if (localStorage.getItem(LAST_SESSION_KEY) === id) {
          if (nextActiveId) {
            localStorage.setItem(LAST_SESSION_KEY, nextActiveId);
          } else {
            localStorage.removeItem(LAST_SESSION_KEY);
          }
        }
        return { sessions: remaining, activeSessionId: nextActiveId };
      });
    },

    clearCurrentSession: async () => {
      const { activeSessionId, sessions } = get();
      if (!activeSessionId) return;

      // デモセッションは初期化不可
      const session = sessions.find((s) => s.id === activeSessionId);
      if (!session || session.isDemo) return;

      await clearSessionData(activeSessionId);

      // updatedAt を更新
      const updated = { ...session, updatedAt: Date.now() };
      await putSession(updated);
      set((s) => ({
        sessions: s.sessions.map((s2) => (s2.id === activeSessionId ? updated : s2)),
      }));

      // インメモリ状態をリセット
      set(() => ({
        entries: [],
        characters: [],
        timelineGroups: [],
        memoGroups: [],
        deductions: [],
        relations: [],
        linkKeywords: [],
      }));
    },
  };
};
