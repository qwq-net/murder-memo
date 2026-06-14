import { nanoid } from 'nanoid';

import {
  bulkPutCharacters,
  getCharactersBySession,
  putCharacter,
  removeCharacterCascade,
} from '@/lib/idb';
import { runOptimisticUpdate } from '@/lib/optimisticRollback';
import { applyReorder, bySortOrder, nextSortOrder } from '@/lib/sortOrder';
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
    const char: Character = {
      role: 'pl',
      showInEntries: true,
      ...partial,
      id: nanoid(),
      sortOrder: nextSortOrder(get().characters),
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
   * キャラ本体・相関図・推理メモ・エントリの掃除は単一トランザクション（removeCharacterCascade）で
   * 行い、途中失敗で「参照だけ残る中途半端な状態」を作らない。失敗時は楽観更新を巻き戻す。
   * キャラクターフィルター（UI state）は永続層外なので set 成功後に別途掃除する。
   * 該当が無いキャラの削除でも安全（周辺データの掃除は no-op になる）。
   */
  removeCharacter: async (id) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const { relations, deductions, entries } = get();
    const prev = {
      characters: get().characters,
      relations,
      deductions,
      entries,
    };

    const relationIds = relations
      .filter((r) => r.fromCharacterId === id || r.toCharacterId === id)
      .map((r) => r.id);
    const relationIdSet = new Set(relationIds);
    const deduction = deductions.find((d) => d.characterId === id);
    const now = Date.now();
    const entryUpdates = entries
      .filter((e) => e.characterTags.includes(id))
      .map((e) => ({
        ...e,
        characterTags: e.characterTags.filter((t) => t !== id),
        updatedAt: now,
      }));
    const entryUpdateById = new Map(entryUpdates.map((e) => [e.id, e]));

    // 楽観更新 → 失敗時は参照ごと巻き戻す（runOptimisticUpdate に集約）
    const ok = await runOptimisticUpdate(get, set, {
      snapshot: prev,
      apply: (s) => ({
        characters: s.characters.filter((c) => c.id !== id),
        relations: s.relations.filter((r) => !relationIdSet.has(r.id)),
        deductions: deduction ? s.deductions.filter((d) => d.id !== deduction.id) : s.deductions,
        entries: s.entries.map((e) => entryUpdateById.get(e.id) ?? e),
      }),
      persist: () =>
        removeCharacterCascade(
          { characterId: id, relationIds, deductionId: deduction?.id, entryUpdates },
          sessionId,
        ),
      errorMessage: '登場人物の削除に失敗しました',
      logLabel: 'removeCharacter',
    });
    if (!ok) return;

    // 全パネルのキャラクターフィルターからも除去（残ると解除不能のまま絞り込みが効き続ける）
    get().removeCharacterFromFilters(id);
  },

  reorderCharacters: async (orderedIds) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    // sortOrder が実際に変化したキャラだけを IDB へ書き込む（reorderMemoGroups と同じく
    // 変化分のみに絞る）。state は全件を昇順に並べて反映。
    const { updated, changed } = applyReorder(get().characters, orderedIds);
    updated.sort(bySortOrder);
    await bulkPutCharacters(changed, sessionId);
    set(() => ({ characters: updated }));
  },
});
