import { nanoid } from 'nanoid';

import {
  bulkPutLinkKeywords,
  deleteLinkKeyword,
  getLinkKeywordsBySession,
  putLinkKeyword,
} from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { LinkKeyword } from '@/types/memo';

export interface LinkKeywordsSlice {
  linkKeywords: LinkKeyword[];

  loadLinkKeywords: (sessionId: string) => Promise<void>;
  /**
   * 与えられた文字列群を辞書に追加する。
   * - trim 後に空のもの、既存と完全一致するものは無視
   * - 配列内の重複も除外
   */
  addLinkKeywords: (words: string[]) => Promise<void>;
  removeLinkKeyword: (id: string) => Promise<void>;
  /** インポート用一括投入 */
  bulkLoadLinkKeywords: (keywords: LinkKeyword[], sessionId: string) => Promise<void>;
}

export const createLinkKeywordsSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): LinkKeywordsSlice => ({
  linkKeywords: [],

  loadLinkKeywords: async (sessionId) => {
    const linkKeywords = await getLinkKeywordsBySession(sessionId);
    set(() => ({ linkKeywords }));
  },

  addLinkKeywords: async (words) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;

    const existingKeywords = new Set(get().linkKeywords.map((k) => k.keyword));
    const seen = new Set<string>();
    const additions: LinkKeyword[] = [];
    const now = Date.now();

    for (const raw of words) {
      const word = raw.trim();
      if (!word) continue;
      if (existingKeywords.has(word)) continue;
      if (seen.has(word)) continue;
      seen.add(word);
      additions.push({ id: nanoid(), keyword: word, createdAt: now });
    }

    if (additions.length === 0) return;

    // 永続化と state 更新を並列実行（独立した put のため並列でよい）
    await Promise.all(additions.map((kw) => putLinkKeyword(kw, sessionId)));
    set((s) => ({ linkKeywords: [...s.linkKeywords, ...additions] }));
  },

  removeLinkKeyword: async (id) => {
    await deleteLinkKeyword(id);
    set((s) => ({ linkKeywords: s.linkKeywords.filter((k) => k.id !== id) }));
  },

  bulkLoadLinkKeywords: async (keywords, sessionId) => {
    await bulkPutLinkKeywords(keywords, sessionId);
    set(() => ({ linkKeywords: keywords }));
  },
});
