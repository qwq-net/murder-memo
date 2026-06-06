import { nanoid } from 'nanoid';

import { bulkPutEntries, deleteEntry, deleteImage, putEntry } from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { MemoEntry, MemoEntryType, PanelId } from '@/types/memo';

export interface EntriesSlice {
  entries: MemoEntry[];

  loadEntries: (entries: MemoEntry[]) => void;
  addEntry: (
    partial: Pick<MemoEntry, 'panel'> &
      Partial<Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>>,
  ) => Promise<MemoEntry>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  moveEntryToPanel: (id: string, panel: PanelId) => Promise<void>;
  reclassifyEntry: (id: string, type: MemoEntryType) => Promise<void>;
  toggleCharacterTag: (entryId: string, characterId: string) => Promise<void>;
  reorderEntries: (panel: PanelId, orderedIds: string[]) => Promise<void>;
  bulkLoadEntries: (entries: MemoEntry[], sessionId: string) => Promise<void>;
}

export const createEntriesSlice = (
  set: (fn: (s: StoreState) => Partial<StoreState>) => void,
  get: () => StoreState,
): EntriesSlice => ({
  entries: [],

  loadEntries: (entries) => set(() => ({ entries })),

  /**
   * 新しいエントリを作成して末尾に追加する。
   * type の既定は 'text'、content の既定は ''、sortOrder は既存の最大+1。id / createdAt /
   * updatedAt は自動採番。activeSessionId が無ければ throw する。
   *
   * 状態を先に同期更新してから IDB へ保存する（後続の addEntry が正しい maxOrder を読めるように）。
   * このため IDB 保存失敗時はメモリに残ったまま（リロードで消える）になる点に注意。
   */
  addEntry: async (partial) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) throw new Error('No active session');

    const maxOrder = get().entries.reduce((m, e) => Math.max(m, e.sortOrder), -1);
    const { panel, ...rest } = partial;
    const entry: MemoEntry = {
      type: 'text',
      content: '',
      characterTags: [],
      ...rest,
      panel,
      id: nanoid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: maxOrder + 1,
    };
    // 状態を先に同期更新（後続の addEntry が正しい maxOrder を取得できるように）
    set((s) => ({ entries: [...s.entries, entry] }));
    await putEntry(entry, sessionId);
    return entry;
  },

  /**
   * 指定エントリを patch でマージ更新し、updatedAt を現在時刻にする。
   * activeSessionId が無い・対象が存在しない場合は何もしない（no-op）。
   * 楽観更新（先に state を反映）し、IDB 保存に失敗したら元の内容へロールバックしてエラートーストを出す。
   */
  updateEntry: async (id, patch) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const entry = prev.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, ...patch, updatedAt: Date.now() };
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      // 保存失敗時は元の配列参照ごと復元する（reorderEntries と同方式。
      // メモリと IDB の乖離を防ぎ、参照比較の Undo 履歴も汚さない）
      set(() => ({ entries: prev }));
      get().addToast('メモの保存に失敗しました', 'error');
      console.error('updateEntry の保存に失敗しました', err);
    }
  },

  /**
   * 指定エントリを削除する。
   * 画像エントリの場合は参照している画像 blob（imageBlobKey）も IDB から削除する。
   * 対象が無ければ delete は no-op。IDB 削除後にメモリ state から除去する。
   */
  deleteEntry: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (entry?.imageBlobKey) await deleteImage(entry.imageBlobKey);
    await deleteEntry(id);
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
    }));
  },

  /**
   * エントリを別パネルへ移動する。
   * タイムライン以外へ移す場合は、タイムライン固有の情報（timelineGroupId / eventTime /
   * eventTimeSortKey）をクリアする（移動先で無効なデータが残らないように）。
   * activeSessionId が無い・対象が無ければ no-op。
   */
  moveEntryToPanel: async (id, panel) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const patch: Partial<MemoEntry> = { panel, updatedAt: Date.now() };
    // タイムラインから離れる場合、グループ・時刻情報をクリア
    if (panel !== 'timeline') {
      patch.timelineGroupId = undefined;
      patch.eventTime = undefined;
      patch.eventTimeSortKey = undefined;
    }
    const updated = { ...entry, ...patch };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
  },

  reclassifyEntry: async (id, type) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, type, updatedAt: Date.now() };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
  },

  toggleCharacterTag: async (entryId, characterId) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const entry = get().entries.find((e) => e.id === entryId);
    if (!entry) return;
    const tags = entry.characterTags.includes(characterId)
      ? entry.characterTags.filter((t) => t !== characterId)
      : [...entry.characterTags, characterId];
    const updated = { ...entry, characterTags: tags, updatedAt: Date.now() };
    await putEntry(updated, sessionId);
    set((s) => ({ entries: s.entries.map((e) => (e.id === entryId ? updated : e)) }));
  },

  /**
   * 指定パネル内のエントリを orderedIds の並びに再採番する（sortOrder = orderedIds 内の位置）。
   *
   * - orderedIds に含まれない、または panel が一致しないエントリは対象外（変更しない）
   * - sortOrder が変わったエントリだけを IDB へ書き込む
   * - 楽観更新（先に state 反映でDnDアニメを滑らかに）し、保存失敗時は並び替え前へロールバックする
   * - 呼び手はそのパネルの全エントリ ID を渡す前提（フィルタ表示中の部分集合を渡すと sortOrder が衝突しうる）
   */
  reorderEntries: async (panel, orderedIds) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const now = Date.now();
    const changedEntries: MemoEntry[] = [];
    const updated = prev.map((e) => {
      const idx = orderedIds.indexOf(e.id);
      if (e.panel !== panel || idx === -1) return e;
      const reordered = { ...e, sortOrder: idx, updatedAt: now };
      changedEntries.push(reordered);
      return reordered;
    });
    // 同期的にstate更新 → DnDオーバーレイが正しい位置にアニメーションする
    set(() => ({ entries: updated }));
    // 対象パネルのエントリだけを IndexedDB に書き込む
    try {
      await bulkPutEntries(changedEntries, sessionId);
    } catch (err) {
      // 保存失敗時は並び替え前の状態へ戻す（メモリと IDB の乖離を防ぐ）
      set(() => ({ entries: prev }));
      get().addToast('並び替えの保存に失敗しました', 'error');
      console.error('reorderEntries の保存に失敗しました', err);
    }
  },

  bulkLoadEntries: async (entries, sessionId) => {
    await bulkPutEntries(entries, sessionId);
    set(() => ({ entries }));
  },
});
