/**
 * Undo/Redo 後のインメモリ状態を IndexedDB に書き戻して同期するモジュール。
 * zundo はインメモリ状態のみ巻き戻すため、永続層への反映は syncStateToIdb が担う。
 */
import {
  bulkPutCharacters,
  bulkPutDeductions,
  bulkPutEntries,
  bulkPutLinkKeywords,
  bulkPutMemoGroups,
  bulkPutRelations,
  bulkPutTimelineGroups,
  clearSessionData,
} from '@/lib/idb';
import type { StoreState } from '@/store/index';

/**
 * Undo/Redo 直後のインメモリ状態を、対象セッションの IndexedDB へ完全リセット方式で書き戻す。
 *
 * - activeSessionId が無ければ何もしない（no-op）
 * - clearSessionData で対象セッションの全ストアを一旦空にしてから現在の state を書き戻す
 *   （差分更新ではなく総入れ替え）
 * - 書き戻す対象: entries / characters / timelineGroups / memoGroups / deductions / relations
 *   （= store の TrackedState。Undo/Redo で巻き戻る範囲そのもの）に加えて linkKeywords も書き戻す。
 *   linkKeywords は TrackedState 外で Undo/Redo の巻き戻し対象ではないが、clearSessionData が
 *   link-keywords ストアごと消すため、現在の state を書き戻さないと IDB 上の辞書が失われてしまう
 *   （メモリ上は残るため再読込時まで損失に気付けない）。よってここで必ず書き戻して整合を保つ。
 */
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
    // linkKeywords は TrackedState 外だが clearSessionData が消すため必ず書き戻す
    bulkPutLinkKeywords(state.linkKeywords, sid),
  ]);
}
