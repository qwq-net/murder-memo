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
  cleanupOrphanImages,
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
import type { StoreState } from '@/store/index';
import type { GameSession, PanelLayout } from '@/types/memo';

export interface SessionsSlice {
  sessions: GameSession[];
  activeSessionId: string | null;

  initSessions: () => Promise<void>;
  createSession: (name: string) => Promise<GameSession>;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  clearCurrentSession: () => Promise<void>;
  /**
   * アクティブセッションのレイアウトを更新する（セッション固有設定）。
   * 楽観更新し、putSession 失敗時は state を巻き戻してエラートーストを出す。
   */
  updateSessionLayout: (layout: PanelLayout) => Promise<void>;
  /**
   * アクティブセッションのレイアウトを破棄してグローバル設定準拠へ戻す。
   * layout を持たないセッションは selectResolvedLayout が settings.layout へ
   * フォールバックする（store/selectors.ts）。
   */
  clearSessionLayout: () => Promise<void>;
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

    /**
     * アプリ起動時のセッション初期化。全スライスの初期データを IDB から読み込んで一括投入する。
     *
     * - デモセッションが未作成 or バージョン不一致なら作り直す（古いものは関連データごと削除）
     * - 直前に開いていたセッション（localStorage）を復元。無ければ最古のセッションにフォールバック
     * - 全 IO 完了後に一度だけ set するため、途中失敗でストアが中途半端な状態にならない
     * - 多重呼び出し（StrictMode 等）は initPromise のキャッシュで1回に集約する。
     *   失敗時は initPromise をクリアして再試行可能にし、エラートーストを出して UI は操作可能にする
     */
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
            // 最終開封セッションが旧デモだったか（削除前に判定）。バージョン更新で旧デモが
            // 別 ID の新デモに差し替わると、復元判定に失敗して最古セッションへ飛ばされるため、
            // 後で新デモ ID へ張り替える。
            const wasOnOldDemo =
              !!existingDemo && localStorage.getItem(LAST_SESSION_KEY) === existingDemo.id;

            // 古いデモがあれば関連データごと削除
            if (existingDemo) {
              await deleteSession(existingDemo.id);
              sessions.splice(sessions.indexOf(existingDemo), 1);
            }

            demoData = await buildDemoSession();
            // 旧デモを開いていたユーザーは新デモへ引き継ぐ（最古セッションへ飛ばさない）
            if (wasOnOldDemo) {
              localStorage.setItem(LAST_SESSION_KEY, demoData.session.id);
            }
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
          let entries, characters, timelineGroups, memoGroups, deductions, relations, linkKeywords;

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

          // 参照されなくなった孤児画像 blob を回収する。削除（エントリ/グループ削除・セッション初期化）は
          // 画像 blob をハード削除せず GC に委ねる方式のため、Undo 履歴が空で安全なこの起動時に掃除する。
          // 失敗してもアプリ動作には影響しないのでログのみ（投げっぱなしにしない）。
          void cleanupOrphanImages().catch((err) =>
            console.error('孤児画像のクリーンアップに失敗しました', err),
          );
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
        // グローバル設定のレイアウトを複製して継承する（以後はセッション単位で独立。
        // 参照を共有すると後のレイアウト編集がグローバル設定を巻き込むため必ず複製）
        layout: structuredClone(get().settings.layout),
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

    updateSessionLayout: async (layout) => {
      const session = get().sessions.find((s) => s.id === get().activeSessionId);
      if (!session) return;
      const updated: GameSession = { ...session, layout, updatedAt: Date.now() };
      const prevSessions = get().sessions;
      // 楽観更新（ポップオーバー操作へ即時反映）→ 失敗時は参照ごと巻き戻し＋エラートースト
      set((s) => ({ sessions: s.sessions.map((s2) => (s2.id === session.id ? updated : s2)) }));
      try {
        await putSession(updated);
      } catch (err) {
        set(() => ({ sessions: prevSessions }));
        get().addToast('レイアウトの保存に失敗しました', 'error');
        console.error('updateSessionLayout の保存に失敗しました', err);
      }
    },

    clearSessionLayout: async () => {
      const session = get().sessions.find((s) => s.id === get().activeSessionId);
      if (!session?.layout) return;
      const { layout: _removed, ...rest } = session;
      void _removed;
      const updated: GameSession = { ...rest, updatedAt: Date.now() };
      const prevSessions = get().sessions;
      set((s) => ({ sessions: s.sessions.map((s2) => (s2.id === session.id ? updated : s2)) }));
      try {
        await putSession(updated);
      } catch (err) {
        set(() => ({ sessions: prevSessions }));
        get().addToast('レイアウトの保存に失敗しました', 'error');
        console.error('clearSessionLayout の保存に失敗しました', err);
      }
    },

    /**
     * セッションと、その配下の全データ（エントリ・画像等）を IDB から削除する。
     *
     * - デモセッションは削除不可（no-op）
     * - 削除対象が現在アクティブなら、残りの先頭セッションへアクティブを移す（全滅時は null）
     * - localStorage の「最終開封セッション」が対象なら、次のアクティブ ID に張り替え or 除去する
     *
     * 注意: このアクション自体は Undo 履歴をクリアしないため、UI 側で pause/clear/resume を
     * 行わずに直接呼ぶと、削除済みデータが Undo で復活しうる（現状の呼び出しは UI 側で防御済み）。
     */
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

    /**
     * 現在のセッションの中身を空にする（セッション枠自体は残す）。
     *
     * - デモセッション、またはアクティブセッションが無ければ no-op
     * - IDB は clearSessionData で配下データを全削除（link-keywords 含む）、session レコードは残す。
     *   画像 blob は keepImages=true で温存する（この操作は TrackedState を空にするため Undo で復活
     *   しうる。即削除すると Undo 後に画像参照が壊れる）。孤児化した blob は次回起動時の
     *   cleanupOrphanImages で回収する
     * - メモリ上の全データスライス（linkKeywords 含む）を空にし、updatedAt を更新する
     * - 削除済みキャラを指すキャラクターフィルターが残らないようクリアする
     *   （同一セッションに留まるため switchSession の subscribe は走らない）
     */
    clearCurrentSession: async () => {
      const { activeSessionId, sessions } = get();
      if (!activeSessionId) return;

      // デモセッションは初期化不可
      const session = sessions.find((s) => s.id === activeSessionId);
      if (!session || session.isDemo) return;

      // keepImages=true: Undo で復活しうるため画像 blob は温存（孤児は起動時 GC で回収）
      await clearSessionData(activeSessionId, true);

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

      // 全エントリ消滅に合わせて絞り込み（キャラ・重要度）もリセットする
      // （同一セッションに留まるため switchSession の subscribe は走らない）
      get().clearAllCharacterFilters();
      get().clearAllImportanceFilters();
    },
  };
};
