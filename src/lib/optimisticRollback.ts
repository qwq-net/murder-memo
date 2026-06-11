/**
 * 楽観更新の失敗時ロールバックを「セッション切替と競合安全」にするヘルパー。
 *
 * 楽観更新アクションは「スナップショット取得 → set で先行反映 → await IDB 書き込み →
 * 失敗時にスナップショットを書き戻す」構造を取るが、await 中にセッション切替
 * （store/index.ts の activeSessionId subscribe による自動リロード）が完了すると、
 * 旧セッションのスナップショットで新セッションのデータを上書きして表示が壊れる。
 *
 * このヘルパーはスナップショット取得時点の activeSessionId をクロージャに閉じ込め、
 * ロールバック実行時に現在の activeSessionId と一致する場合のみ snapshot を書き戻す。
 * 不一致なら巻き戻しを放棄する: 切替リロードが新セッションの正しいデータを取得済みであり、
 * 失敗した書き込みは旧セッションの IDB に含まれていないため、放棄しても次回その
 * セッションをロードしたとき自然に整合した（更新前の）状態が読み出される。
 *
 * snapshot は取得時の参照をそのまま書き戻すため、参照比較ベースの Undo 履歴
 * （zundo の equality）を汚さない（CLAUDE.md「楽観更新のロールバック」原則を維持）。
 */
export function captureSessionRollback<S extends { activeSessionId: string | null }>(
  get: () => S,
  set: (fn: (s: S) => Partial<S>) => void,
  snapshot: Partial<S>,
): () => void {
  const sessionId = get().activeSessionId;
  return () => {
    // セッションが切り替わっていたら巻き戻さない（切替リロードが正しい状態を取得済み）
    if (get().activeSessionId !== sessionId) return;
    set(() => snapshot);
  };
}
