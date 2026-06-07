import { nanoid } from 'nanoid';

import { bulkPutEntries, deleteEntry, putEntry } from '@/lib/idb';
import type { StoreState } from '@/store/index';
import type { MemoEntry, PanelId } from '@/types/memo';

export interface EntriesSlice {
  entries: MemoEntry[];

  loadEntries: (entries: MemoEntry[]) => void;
  addEntry: (
    partial: Pick<MemoEntry, 'panel'> &
      Partial<Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>>,
  ) => Promise<MemoEntry>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  /**
   * エントリを別パネルへ移動する。移動先がタイムラインなら所属グループ(timelineGroupId)を、
   * メモパネルなら所属メモグループ(groupId)を opts で同時指定し、1 回の更新で原子的に確定する
   * （panel と group を別アクションに分けると 2 手目失敗で不可視の孤児が残るため）。
   */
  moveEntryToPanel: (
    id: string,
    panel: PanelId,
    opts?: { timelineGroupId?: string; groupId?: string },
  ) => Promise<void>;
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
   * IDB 保存に失敗したら追加分のみを除去してロールバックし、エラートーストを出して **再 throw** する
   * （updateEntry / reorderEntries と同じく「メモリと IDB を乖離させない」契約。新規追加なので
   * 参照復元ではなく id 一致で除去する）。呼び手は throw を捕捉して後始末（画像 blob 削除等）できる。
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
    try {
      await putEntry(entry, sessionId);
    } catch (err) {
      set((s) => ({ entries: s.entries.filter((e) => e.id !== entry.id) }));
      get().addToast('メモの追加に失敗しました', 'error');
      console.error('addEntry の保存に失敗しました', err);
      throw err;
    }
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
   * 画像エントリの画像 blob はここでは **ハード削除しない**（imageBlobKey 参照を持つエントリが
   * 消えるだけ）。エントリ削除は TrackedState の変更なので Undo で復活しうるが、blob を即削除すると
   * Undo 後に参照先を失って画像が壊れる。また複製で同一 blob を共有するケースもある。
   * 参照されなくなった孤児 blob は、Undo 履歴が空の安全な時点（アプリ初期化）で
   * cleanupOrphanImages がまとめて回収する。対象が無ければ no-op。
   */
  deleteEntry: async (id) => {
    await deleteEntry(id);
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
    }));
  },

  /** {@inheritDoc EntriesSlice.moveEntryToPanel} */
  moveEntryToPanel: async (id, panel, opts = {}) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const entry = prev.find((e) => e.id === id);
    if (!entry) return;
    const patch: Partial<MemoEntry> = { panel, updatedAt: Date.now() };
    if (panel === 'timeline') {
      // タイムラインへ: type を timeline 化し所属グループを設定する。これで
      // 「panel==='timeline' は timelineGroupId 必須」の不変条件を 1 回の更新で満たし、
      // 旧来の「move → 別 update」2 段階による不可視孤児（timelineGroupId 欠落）を防ぐ。
      // メモグループ参照はタイムラインでは無効なのでクリアする。
      patch.type = 'timeline';
      patch.timelineGroupId = opts.timelineGroupId;
      patch.groupId = undefined;
    } else {
      // タイムラインから離れる: グループ・時刻情報をクリア（移動先で無効なデータを残さない）
      patch.timelineGroupId = undefined;
      patch.eventTime = undefined;
      patch.eventTimeSortKey = undefined;
      // 呼び手が移動先メモグループを指定した場合のみ groupId を更新する（未指定なら保持）
      if ('groupId' in opts) patch.groupId = opts.groupId;
    }
    const updated = { ...entry, ...patch };
    // 楽観更新 → 失敗時は参照ごとロールバック＋エラートースト（updateEntry と同方式）
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      set(() => ({ entries: prev }));
      get().addToast('メモの移動に失敗しました', 'error');
      console.error('moveEntryToPanel の保存に失敗しました', err);
    }
  },

  toggleCharacterTag: async (entryId, characterId) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const entry = prev.find((e) => e.id === entryId);
    if (!entry) return;
    const tags = entry.characterTags.includes(characterId)
      ? entry.characterTags.filter((t) => t !== characterId)
      : [...entry.characterTags, characterId];
    const updated = { ...entry, characterTags: tags, updatedAt: Date.now() };
    set((s) => ({ entries: s.entries.map((e) => (e.id === entryId ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      set(() => ({ entries: prev }));
      get().addToast('関連人物の更新に失敗しました', 'error');
      console.error('toggleCharacterTag の保存に失敗しました', err);
    }
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
