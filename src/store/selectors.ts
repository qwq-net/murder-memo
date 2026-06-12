import type { StoreState } from '@/store/index';
import type { PanelLayout } from '@/types/memo';

/**
 * 表示に使うパネルレイアウトを解決するセレクタ。
 *
 * 優先順位: リサイズドラッグ中の一時状態（layoutDraft）→ アクティブセッション固有の
 * レイアウト（session.layout）→ グローバル設定（settings.layout）。
 * セッションの layout が未設定（本機能導入前のセッション等）の間はグローバルに追従し、
 * セッション側を編集した時点で独立する（copy-on-write）。
 *
 * 3つの安定参照のフォールバックなので追加のメモ化は不要。ただし配列派生
 * （visiblePanels 等）をセレクタで直接返すと毎 set で新配列になり再レンダーを誘発するため、
 * 消費側はこのセレクタで layout 参照を購読し、派生は useMemo で計算する規約とする。
 *
 * store/index.ts ではなく独立モジュールに置くのは、スライス（ui.ts 等）からも
 * 実行時 import できるようにするため（store/index.ts はスライスを import しているので、
 * スライス側から store/index.ts の値を import すると循環参照になる）。
 */
export const selectResolvedLayout = (s: StoreState): PanelLayout =>
  s.layoutDraft ?? s.sessions.find((x) => x.id === s.activeSessionId)?.layout ?? s.settings.layout;
