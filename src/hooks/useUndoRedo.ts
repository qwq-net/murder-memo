import { useEffect } from 'react';

import { getT, type TFunc } from '@/i18n';
import { syncStateToIdb } from '@/lib/undoSync';
import type { StoreState } from '@/store';
import { useStore } from '@/store';

/**
 * undo/redo の前後 state を比較し、トースト用の変更説明文を返す。
 *
 * 配列の参照比較で差分を判定する（要素数の増減があれば「N件追加/削除」、
 * 数が同じで参照だけ変われば「編集」「変更」のような汎用ラベル）。
 * このため並び替えやパネル移動など件数不変の変更はすべて「メモ編集」とまとめて表示される。
 * 該当する変更が一つも無ければ "変更" を返す（空文字は返さない）。
 */
function describeChange(before: StoreState, after: StoreState, t: TFunc): string {
  const diffs: string[] = [];

  const entryDiff = after.entries.length - before.entries.length;
  if (entryDiff > 0) diffs.push(t('hooks.change.entryAdded', { n: entryDiff }));
  else if (entryDiff < 0) diffs.push(t('hooks.change.entryRemoved', { n: -entryDiff }));
  else if (before.entries !== after.entries) diffs.push(t('hooks.change.entryEdited'));

  if (before.characters !== after.characters) {
    const charDiff = after.characters.length - before.characters.length;
    if (charDiff > 0) diffs.push(t('hooks.change.charAdded', { n: charDiff }));
    else if (charDiff < 0) diffs.push(t('hooks.change.charRemoved', { n: -charDiff }));
    else diffs.push(t('hooks.change.charChanged'));
  }

  if (before.timelineGroups !== after.timelineGroups) diffs.push(t('hooks.change.timelineGroups'));
  if (before.memoGroups !== after.memoGroups) diffs.push(t('hooks.change.memoGroups'));
  if (before.deductions !== after.deductions) diffs.push(t('hooks.change.deductions'));
  if (before.relations !== after.relations) diffs.push(t('hooks.change.relations'));

  return diffs.length > 0 ? diffs.join(t('hooks.change.separator')) : t('hooks.change.generic');
}

/**
 * Undo/Redo 後の state を IDB へ同期する。同期は単一トランザクション（replaceSessionData）で
 * 行われ、失敗時は全体がロールバックされるため IDB 側は同期前の状態に保たれる。その場合
 * メモリ（巻き戻し済み）と IDB が乖離するため、黙殺せずユーザーへ通知する。
 * （リロードすると IDB 側＝同期前の内容に戻るため、エクスポートでの保全を促す）
 */
async function persistUndoSync(state: StoreState): Promise<void> {
  try {
    await syncStateToIdb(state);
  } catch (err) {
    console.error('Undo/Redo の IDB 同期に失敗しました', err);
    useStore.getState().addToast(getT()('hooks.undo.syncFailed'), 'error');
  }
}

/**
 * Ctrl+Z / Ctrl+Shift+Z（Mac: Cmd、Redo は Ctrl+Y も可）でデータ変更を Undo/Redo するフック。
 *
 * - テキスト入力中（input / textarea フォーカス中、contentEditable）は発火しない
 * - 巻き戻せる/やり直せる履歴が無ければ何もしない
 * - Undo/Redo 後はインメモリ状態を IndexedDB に同期し（syncStateToIdb、失敗はログのみ）、
 *   変更内容をトーストで通知する
 * - document に keydown リスナーを張り、アンマウントで解除する（戻り値なし）
 */
export function useUndoRedo() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // テキスト入力中は無視
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable)
        return;

      // Shift 併用時は KeyboardEvent.key が大文字 'Z'、CapsLock でも大文字になるため
      // toLowerCase で吸収する（生比較だと Ctrl+Shift+Z の Redo が永遠に発火しない）
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const isUndo = mod && key === 'z' && !e.shiftKey;
      const isRedo = mod && ((key === 'z' && e.shiftKey) || key === 'y');

      if (!isUndo && !isRedo) return;
      e.preventDefault();

      const temporal = useStore.temporal.getState();

      if (isUndo && temporal.pastStates.length > 0) {
        const before = useStore.getState();
        temporal.undo();
        const after = useStore.getState();
        void persistUndoSync(after);
        const t = getT();
        useStore.getState().addToast(t('hooks.undo.done', { desc: describeChange(before, after, t) }));
      } else if (isRedo && temporal.futureStates.length > 0) {
        const before = useStore.getState();
        temporal.redo();
        const after = useStore.getState();
        void persistUndoSync(after);
        const t = getT();
        useStore
          .getState()
          .addToast(t('hooks.undo.redone', { desc: describeChange(before, after, t) }));
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
