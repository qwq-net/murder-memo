import { useEffect } from 'react';

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
function describeChange(before: StoreState, after: StoreState): string {
  const diffs: string[] = [];

  const entryDiff = after.entries.length - before.entries.length;
  if (entryDiff > 0) diffs.push(`メモ ${entryDiff}件追加`);
  else if (entryDiff < 0) diffs.push(`メモ ${-entryDiff}件削除`);
  else if (before.entries !== after.entries) diffs.push('メモ編集');

  if (before.characters !== after.characters) {
    const charDiff = after.characters.length - before.characters.length;
    if (charDiff > 0) diffs.push(`登場人物 ${charDiff}人追加`);
    else if (charDiff < 0) diffs.push(`登場人物 ${-charDiff}人削除`);
    else diffs.push('登場人物変更');
  }

  if (before.timelineGroups !== after.timelineGroups) diffs.push('タイムライングループ変更');
  if (before.memoGroups !== after.memoGroups) diffs.push('メモグループ変更');
  if (before.deductions !== after.deductions) diffs.push('推理メモ変更');
  if (before.relations !== after.relations) diffs.push('相関図変更');

  return diffs.length > 0 ? diffs.join('、') : '変更';
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

      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y');

      if (!isUndo && !isRedo) return;
      e.preventDefault();

      const temporal = useStore.temporal.getState();

      if (isUndo && temporal.pastStates.length > 0) {
        const before = useStore.getState();
        temporal.undo();
        const after = useStore.getState();
        syncStateToIdb(after).catch((err) => console.error('Undo IDB sync failed:', err));
        useStore.getState().addToast(`元に戻しました: ${describeChange(before, after)}`);
      } else if (isRedo && temporal.futureStates.length > 0) {
        const before = useStore.getState();
        temporal.redo();
        const after = useStore.getState();
        syncStateToIdb(after).catch((err) => console.error('Redo IDB sync failed:', err));
        useStore.getState().addToast(`やり直しました: ${describeChange(before, after)}`);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
