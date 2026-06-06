import { nanoid } from 'nanoid';

import {
  bulkPutCharacters,
  deleteCharacter,
  getCharactersBySession,
  putCharacter,
} from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { Character } from '@/types/memo';

export interface CharactersSlice {
  characters: Character[];

  loadCharacters: (sessionId: string) => Promise<void>;
  addCharacter: (
    partial: Partial<Omit<Character, 'id' | 'sortOrder'>> & Pick<Character, 'name' | 'color'>,
  ) => Promise<Character>;
  updateCharacter: (id: string, patch: Partial<Character>) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  reorderCharacters: (orderedIds: string[]) => Promise<void>;
  bulkLoadCharacters: (chars: Character[], sessionId: string) => Promise<void>;
}

export const createCharactersSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): CharactersSlice => ({
  characters: [],

  loadCharacters: async (sessionId) => {
    const chars = await getCharactersBySession(sessionId);
    chars.sort((a, b) => a.sortOrder - b.sortOrder);
    set(() => ({ characters: chars }));
  },

  /**
   * 新しいキャラクターを作成して末尾に追加する。
   * role / showInEntries の既定は pl / true。sortOrder は既存の最大+1。id は自動採番。
   * activeSessionId が無ければ throw する（呼び手はアクティブセッション前提で呼ぶこと）。
   * IDB へ保存し、生成したキャラクターを返す。
   */
  addCharacter: async (partial) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) throw new Error('No active session');
    const maxOrder = get().characters.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const char: Character = {
      role: 'pl',
      showInEntries: true,
      ...partial,
      id: nanoid(),
      sortOrder: maxOrder + 1,
    };
    await putCharacter(char, sessionId);
    set((s) => ({ characters: [...s.characters, char] }));
    return char;
  },

  updateCharacter: async (id, patch) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const char = get().characters.find((c) => c.id === id);
    if (!char) return;
    const updated = { ...char, ...patch };
    await putCharacter(updated, sessionId);
    set((s) => ({ characters: s.characters.map((c) => (c.id === id ? updated : c)) }));
  },

  /**
   * キャラクターを削除し、そのキャラを参照する周辺データも連動して掃除する。
   *
   * 連動削除（ダングリング参照を残さない）:
   * - 相関図の関係線（from / to のいずれかが当該キャラ）
   * - 当該キャラの推理メモ（deduction）
   * - 全エントリの characterTags から当該 ID を除去
   * - 全パネルのキャラクターフィルターから当該 ID を除去（削除済みキャラで絞り込んだまま
   *   バーから解除できずパネルが空白化するのを防ぐ）
   *
   * 注意: 単一トランザクションではないため、途中の IDB エラーで一部だけ消える可能性がある。
   * 該当が無いキャラの削除でも安全（周辺データの掃除は no-op になる）。
   */
  removeCharacter: async (id) => {
    await deleteCharacter(id);
    const { relations, removeRelation, removeDeduction, entries, updateEntry } = get();
    // 相関図の関係線（from / to 双方）を削除
    const related = relations.filter((r) => r.fromCharacterId === id || r.toCharacterId === id);
    for (const r of related) {
      await removeRelation(r.id);
    }
    // 推理メモ（characterId 参照）の孤児を削除（無ければ no-op）
    await removeDeduction(id);
    // エントリのキャラクタータグから当該 ID を除去（削除済みキャラへのダングリング参照を残さない）
    const tagged = entries.filter((e) => e.characterTags.includes(id));
    for (const entry of tagged) {
      await updateEntry(entry.id, {
        characterTags: entry.characterTags.filter((t) => t !== id),
      });
    }
    // 全パネルのキャラクターフィルターからも除去（残ると解除不能のまま絞り込みが効き続ける）
    get().removeCharacterFromFilters(id);
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }));
  },

  reorderCharacters: async (orderedIds) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const updated = get().characters.map((c) => {
      const idx = orderedIds.indexOf(c.id);
      return idx === -1 ? c : { ...c, sortOrder: idx };
    });
    await bulkPutCharacters(updated, sessionId);
    set(() => ({ characters: updated.sort((a, b) => a.sortOrder - b.sortOrder) }));
  },

  bulkLoadCharacters: async (chars, sessionId) => {
    await bulkPutCharacters(chars, sessionId);
    set(() => ({ characters: chars }));
  },
});
