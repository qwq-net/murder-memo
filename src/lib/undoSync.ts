/**
 * Undo/Redo 後にインメモリ状態を IndexedDB に同期する。
 * zundo はインメモリのみ巻き戻すため、IDB への反映はこの関数で行う。
 * セッションの全データをクリアして現在の状態を書き戻す（完全リセット方式）。
 */
import {
  bulkPutCharacters,
  bulkPutDeductions,
  bulkPutEntries,
  bulkPutMemoGroups,
  bulkPutRelations,
  bulkPutTimelineGroups,
  clearSessionData,
} from '@/lib/idb';
import type { StoreState } from '@/store/index';

export async function syncStateToIdb(state: StoreState): Promise<void> {
  const sid = state.activeSessionId;
  if (!sid) return;

  await clearSessionData(sid);
  await Promise.all([
    bulkPutEntries(state.entries, sid),
    bulkPutCharacters(state.characters, sid),
    bulkPutTimelineGroups(state.timelineGroups),
    bulkPutMemoGroups(state.memoGroups),
    bulkPutDeductions(state.deductions),
    bulkPutRelations(state.relations),
  ]);
}
