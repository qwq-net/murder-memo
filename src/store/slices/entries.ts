import { nanoid } from 'nanoid';

import { timelineFieldPatch } from '@/lib/entryPanelTransform';
import { bulkPutEntries, deleteEntry, putEntry } from '@/lib/idb';
import { captureSessionRollback } from '@/lib/optimisticRollback';
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
  /**
   * 同一パネル内でエントリの所属メモグループ（groupId。undefined で未分類）を変更する。
   * 移動先グループの末尾へ置くため sortOrder を当該パネルの最大 +1 に採番する
   * （据え置くと移動先での表示位置が旧 sortOrder 依存で不定になるため）。
   */
  setEntryGroup: (id: string, groupId: string | undefined) => Promise<void>;
  toggleCharacterTag: (entryId: string, characterId: string) => Promise<void>;
  reorderEntries: (panel: PanelId, orderedIds: string[]) => Promise<void>;
  /**
   * コンテナ跨ぎの DnD 移動を 1 アクションで原子的に確定する。
   *
   * パネル・メモグループ・タイムライングループ・時刻（時間帯）の変更と、移動先パネル内での
   * 並び順（orderedIds）を同時に反映する。reorderEntries（並びのみ）/ setEntryGroup
   * （同一パネルのグループのみ）/ moveEntryToPanel（パネルのみ・末尾固定）を統合した、
   * DnD 専用の上位アクション。
   *
   * - panel/timeline 系フィールドの整合は timelineFieldPatch（lib/entryPanelTransform）に集約
   * - orderedIds は「移動先パネルの全エントリ id を移動後の表示順に並べたもの」。sortOrder を
   *   index で再採番する（reorderEntries と同じ契約。フィルタ中は DnD 無効なので部分集合は来ない）
   * - 楽観更新し、IDB 保存失敗時は移動前へロールバック＋エラートースト
   */
  moveEntryAcrossContainers: (args: {
    id: string;
    panel: PanelId;
    groupId?: string;
    timelineGroupId?: string;
    eventTime?: string;
    eventTimeSortKey?: number;
    orderedIds: string[];
  }) => Promise<void>;
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
      // セッションが切り替わっていなければ追加分のみ除去する。切替済みなら state は既に
      // 新セッションのデータで追加分は存在せず、filter は無駄な新配列参照を作って
      // 切替直後の Undo 履歴を汚すだけなので触らない（captureSessionRollback と同方針）
      if (get().activeSessionId === sessionId) {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== entry.id) }));
      }
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
    const rollback = captureSessionRollback(get, set, { entries: prev });
    const updated = { ...entry, ...patch, updatedAt: Date.now() };
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      // 保存失敗時は元の配列参照ごと復元する（reorderEntries と同方式。
      // メモリと IDB の乖離を防ぎ、参照比較の Undo 履歴も汚さない）。
      // await 中にセッション切替が完了していた場合は巻き戻さない（captureSessionRollback 参照）
      rollback();
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
    // 移動先パネルの末尾へ配置する（sortOrder を据え置くと移動先での表示位置が
    // 旧 sortOrder 依存で不定になるため、移動先の最大 sortOrder + 1 を採番する）
    const maxOrder = prev
      .filter((e) => e.panel === panel && e.id !== id)
      .reduce((m, e) => Math.max(m, e.sortOrder), -1);
    const patch: Partial<MemoEntry> = { panel, sortOrder: maxOrder + 1, updatedAt: Date.now() };
    // panel/timeline 系フィールドの整合は timelineFieldPatch に集約（moveEntryAcrossContainers と共用）。
    // 「panel==='timeline' は timelineGroupId 必須・type='timeline'」「timeline 以外では timeline 系
    // フィールドをクリア」を 1 回の更新で満たし、不可視孤児（timelineGroupId 欠落）を防ぐ。
    Object.assign(
      patch,
      timelineFieldPatch(panel, { timelineGroupId: opts.timelineGroupId }, entry),
    );
    if (panel === 'timeline') {
      // メモグループ参照はタイムラインでは無効なのでクリアする
      patch.groupId = undefined;
    } else if ('groupId' in opts) {
      // 呼び手が移動先メモグループを指定した場合のみ groupId を更新する（未指定なら保持）
      patch.groupId = opts.groupId;
    }
    const updated = { ...entry, ...patch };
    // 楽観更新 → 失敗時は参照ごとロールバック＋エラートースト（updateEntry と同方式）
    const rollback = captureSessionRollback(get, set, { entries: prev });
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      rollback();
      get().addToast('メモの移動に失敗しました', 'error');
      console.error('moveEntryToPanel の保存に失敗しました', err);
    }
  },

  setEntryGroup: async (id, groupId) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const entry = prev.find((e) => e.id === id);
    if (!entry || entry.groupId === groupId) return;
    const maxOrder = prev
      .filter((e) => e.panel === entry.panel && e.id !== id)
      .reduce((m, e) => Math.max(m, e.sortOrder), -1);
    const updated = { ...entry, groupId, sortOrder: maxOrder + 1, updatedAt: Date.now() };
    const rollback = captureSessionRollback(get, set, { entries: prev });
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      rollback();
      get().addToast('グループの変更に失敗しました', 'error');
      console.error('setEntryGroup の保存に失敗しました', err);
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
    const rollback = captureSessionRollback(get, set, { entries: prev });
    set((s) => ({ entries: s.entries.map((e) => (e.id === entryId ? updated : e)) }));
    try {
      await putEntry(updated, sessionId);
    } catch (err) {
      rollback();
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
    const rollback = captureSessionRollback(get, set, { entries: prev });
    set(() => ({ entries: updated }));
    // 対象パネルのエントリだけを IndexedDB に書き込む
    try {
      await bulkPutEntries(changedEntries, sessionId);
    } catch (err) {
      // 保存失敗時は並び替え前の状態へ戻す（メモリと IDB の乖離を防ぐ）
      rollback();
      get().addToast('並び替えの保存に失敗しました', 'error');
      console.error('reorderEntries の保存に失敗しました', err);
    }
  },

  /** {@inheritDoc EntriesSlice.moveEntryAcrossContainers} */
  moveEntryAcrossContainers: async ({
    id,
    panel,
    groupId,
    timelineGroupId,
    eventTime,
    eventTimeSortKey,
    orderedIds,
  }) => {
    const sessionId = get().activeSessionId;
    if (!sessionId) return;
    const prev = get().entries;
    const entry = prev.find((e) => e.id === id);
    if (!entry) return;
    const now = Date.now();

    // 対象エントリの属性 patch（panel/timeline 整合は timelineFieldPatch に集約）
    const attrs: Partial<MemoEntry> = {
      panel,
      ...timelineFieldPatch(panel, { timelineGroupId, eventTime, eventTimeSortKey }, entry),
      groupId: panel === 'timeline' ? undefined : groupId,
    };

    // orderedIds による sortOrder 再採番（移動先パネルのみ）。対象エントリには属性変更も合成する。
    const orderIndex = new Map(orderedIds.map((eid, i) => [eid, i]));
    const changed: MemoEntry[] = [];
    const updated = prev.map((e) => {
      if (e.id === id) {
        const moved: MemoEntry = {
          ...e,
          ...attrs,
          sortOrder: orderIndex.get(id) ?? e.sortOrder,
          updatedAt: now,
        };
        // updatedAt を除いて実質変化がなければ据え置く（no-op で Undo 履歴を汚さない）
        const unchanged =
          moved.panel === e.panel &&
          moved.groupId === e.groupId &&
          moved.timelineGroupId === e.timelineGroupId &&
          moved.eventTime === e.eventTime &&
          moved.eventTimeSortKey === e.eventTimeSortKey &&
          moved.sortOrder === e.sortOrder &&
          moved.type === e.type;
        if (unchanged) return e;
        changed.push(moved);
        return moved;
      }
      // 移動先パネルに属し orderedIds に含まれる他エントリの sortOrder を採番する
      const idx = orderIndex.get(e.id);
      if (idx !== undefined && e.panel === panel && e.sortOrder !== idx) {
        const reordered = { ...e, sortOrder: idx, updatedAt: now };
        changed.push(reordered);
        return reordered;
      }
      return e;
    });

    // 実質変化が無ければ何もしない（参照を変えず Undo 履歴・IDB 書き込みを発生させない）
    if (changed.length === 0) return;

    // 楽観更新 → 失敗時は移動前へロールバック＋エラートースト（reorderEntries と同方式）
    const rollback = captureSessionRollback(get, set, { entries: prev });
    set(() => ({ entries: updated }));
    try {
      await bulkPutEntries(changed, sessionId);
    } catch (err) {
      rollback();
      get().addToast('メモの移動に失敗しました', 'error');
      console.error('moveEntryAcrossContainers の保存に失敗しました', err);
    }
  },
});
