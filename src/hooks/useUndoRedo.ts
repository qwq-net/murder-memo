import { useEffect } from 'react';

import { syncStateToIdb } from '@/lib/undoSync';
import { useStore } from '@/store';
import type { StoreState } from '@/store';

/** undo/redo で何が変わったかを検出し、説明文を返す */
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
 * Ctrl+Z / Ctrl+Shift+Z (Mac: Cmd) でエントリ等のデータ変更を Undo/Redo するフック。
 * テキスト入力中（input / textarea にフォーカス中）は発火しない。
 */
export function useUndoRedo() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // テキスト入力中は無視
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y');

      if (!isUndo && !isRedo) return;
      e.preventDefault();

      const temporal = useStore.temporal.getState();

      if (isUndo && temporal.pastStates.length > 0) {
        const before = useStore.getState();
        temporal.undo();
        const after = useStore.getState();
        syncStateToIdb(after).catch(() => {});
        useStore.getState().addToast(`元に戻しました: ${describeChange(before, after)}`);
      } else if (isRedo && temporal.futureStates.length > 0) {
        const before = useStore.getState();
        temporal.redo();
        const after = useStore.getState();
        syncStateToIdb(after).catch(() => {});
        useStore.getState().addToast(`やり直しました: ${describeChange(before, after)}`);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
