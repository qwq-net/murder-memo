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

/**
 * 「楽観更新 → IDB 書き込み → 失敗時ロールバック + エラートースト + ログ」の定型句を集約する。
 *
 * 各スライスで手書き反復していた try/catch 構造を1箇所に閉じ込め、ロールバックの
 * 競合安全性（captureSessionRollback のセッション一致チェック）を新規アクションでも
 * 取りこぼさないようにする。snapshot は取得時の参照をそのまま書き戻すため Undo 履歴を汚さない。
 *
 * @returns 書き込み成功で true / 失敗（ロールバック実行済み）で false。
 *          成功時のみ追加処理を行うアクション（removeCharacter のフィルター掃除等）が分岐に使う。
 */
export async function runOptimisticUpdate<
  S extends {
    activeSessionId: string | null;
    addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  },
>(
  get: () => S,
  set: (fn: (s: S) => Partial<S>) => void,
  opts: {
    /** ロールバック時に書き戻すスナップショット（更新前の参照をそのまま渡す） */
    snapshot: Partial<S>;
    /** 楽観反映する set の中身 */
    apply: (s: S) => Partial<S>;
    /** IDB への永続化処理 */
    persist: () => Promise<unknown>;
    /** 失敗時のトースト文言（既存文言を一字一句維持して渡す） */
    errorMessage: string;
    /** console.error のラベル（既存ラベルを一字一句維持して渡す）。出力は `${logLabel} の保存に失敗しました` */
    logLabel: string;
  },
): Promise<boolean> {
  const rollback = captureSessionRollback(get, set, opts.snapshot);
  set(opts.apply);
  try {
    await opts.persist();
    return true;
  } catch (err) {
    // 保存失敗時は元の参照ごとロールバックする（メモリと IDB の乖離を防ぎ、参照比較の
    // Undo 履歴も汚さない）。await 中にセッション切替が完了していた場合は巻き戻さない
    // （captureSessionRollback 参照。旧スナップショットで新セッションを上書きしない）
    rollback();
    get().addToast(opts.errorMessage, 'error');
    console.error(`${opts.logLabel} の保存に失敗しました`, err);
    return false;
  }
}
