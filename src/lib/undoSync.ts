/**
 * Undo/Redo 後のインメモリ状態を IndexedDB に書き戻して同期するモジュール。
 * zundo はインメモリ状態のみ巻き戻すため、永続層への反映は syncStateToIdb が担う。
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

/**
 * Undo/Redo 直後のインメモリ状態を、対象セッションの IndexedDB へ完全リセット方式で書き戻す。
 *
 * - activeSessionId が無ければ何もしない（no-op）
 * - clearSessionData で対象セッションの全ストアを一旦空にしてから現在の state を書き戻す
 *   （差分更新ではなく総入れ替え）
 * - 書き戻す対象: entries / characters / timelineGroups / memoGroups / deductions / relations
 *   （= store の TrackedState と一致。Undo/Redo で巻き戻る範囲そのもの）
 *
 * ⚠️ 既知の不整合（要修正候補）: clearSessionData は link-keywords ストアも削除するが、
 *    本関数は linkKeywords を書き戻さない。linkKeywords は TrackedState 外で Undo/Redo の
 *    巻き戻し対象でもないため、Undo/Redo を行うたびに IDB 上のリンクキーワード辞書だけが消え、
 *    次回のセッション切替/再読込で辞書が失われる（その場ではメモリに残るため気付きにくい）。
 *    修正するなら bulkPutLinkKeywords を書き戻しに追加するか、clearSessionData 側で
 *    link-keywords を温存する必要がある。
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
  ]);
}
