/**
 * Undo/Redo 後のインメモリ状態を IndexedDB に書き戻して同期するモジュール。
 * zundo はインメモリ状態のみ巻き戻すため、永続層への反映は syncStateToIdb が担う。
 */
import { replaceSessionData } from '@/lib/idb';
import type { StoreState } from '@/store/index';

/**
 * Undo/Redo 直後のインメモリ状態を、対象セッションの IndexedDB へ完全リセット方式で書き戻す。
 *
 * - activeSessionId が無ければ何もしない（no-op）
 * - 永続化は idb の {@link replaceSessionData} に委譲する。これは「対象セッション配下の削除 →
 *   現 state の書き戻し」を **単一トランザクション** で行うため、途中失敗（QuotaExceeded・abort 等）
 *   でも全体がロールバックされ、「一部ストアが空のまま確定してデータ消失」する事故が起きない
 *   （旧実装は clearSessionData と各 bulkPut が別トランザクションで、bulkPut 失敗時にそのストアが
 *   空のまま残る恐れがあった）。
 * - 書き戻す対象: entries / characters / timelineGroups / memoGroups / deductions / relations
 *   （= TrackedState。Undo/Redo で巻き戻る範囲）に加えて linkKeywords も含める。linkKeywords は
 *   TrackedState 外だが、セッション配下削除で消えるため書き戻さないと IDB 上の辞書が失われる。
 * - 画像 blob は state に本体を持たず書き戻せないため replaceSessionData は images を触らない
 *   （旧 keepImages=true 相当）。これを怠ると Undo/Redo 一回でセッションの全画像が失われる。
 * - 失敗時は throw する。呼び手（useUndoRedo）は catch でユーザーに通知すること（黙殺禁止）。
 */
export async function syncStateToIdb(state: StoreState): Promise<void> {
  const sid = state.activeSessionId;
  if (!sid) return;

  await replaceSessionData(
    {
      entries: state.entries,
      characters: state.characters,
      timelineGroups: state.timelineGroups,
      memoGroups: state.memoGroups,
      deductions: state.deductions,
      relations: state.relations,
      // linkKeywords は TrackedState 外だが、セッション配下削除で消えるため必ず書き戻す
      linkKeywords: state.linkKeywords,
    },
    sid,
  );
}
