import { useCallback, useRef, useState } from 'react';

import { useStore } from '@/store';

interface UseEntryDraftParams<T extends Record<string, unknown>> {
  entryId: string;
  currentValues: T;
  isEditing: boolean;
  onSave: (values: T) => void;
}

/** 同一キー集合の浅い比較。全キーの値が === なら true。 */
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

/**
 * エントリ編集のドラフトステート管理を共通化するフック。
 * TextEntry と TimelineEntry で利用。
 *
 * - props → draft の同期（非編集時のみ）
 * - cancelledRef による Escape キャンセル
 * - handleBlur での保存 or キャンセル判定
 */
export function useEntryDraft<T extends Record<string, unknown>>({
  currentValues,
  isEditing,
  onSave,
}: UseEntryDraftParams<T>) {
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const [draft, setDraftState] = useState<T>(currentValues);
  const cancelledRef = useRef(false);
  const blurHandledRef = useRef(false);

  // props → draft 同期（非編集時のみ）
  // currentValues はオブジェクトなので浅い比較で変更検出する
  // （JSON.stringify はキー順序の差で誤検出し、undefined 値の差を取りこぼすため使わない）
  const [prevSync, setPrevSync] = useState<{ values: T; isEditing: boolean }>({
    values: currentValues,
    isEditing,
  });
  if (!shallowEqual(currentValues, prevSync.values) || isEditing !== prevSync.isEditing) {
    setPrevSync({ values: currentValues, isEditing });
    if (!isEditing) {
      setDraftState(currentValues);
    }
  }

  const setDraft = useCallback((patch: Partial<T>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  // 二重実行防止付き blur ハンドラー
  const handleBlur = useCallback(() => {
    if (blurHandledRef.current) return;
    blurHandledRef.current = true;
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setFocusedEntry(null);
      return;
    }
    onSave(draft);
    setFocusedEntry(null);
  }, [draft, onSave, setFocusedEntry]);

  const handleEscape = useCallback(() => {
    cancelledRef.current = true;
    setDraftState(currentValues);
  }, [currentValues]);

  // 編集開始時にガードをリセット
  const resetGuards = useCallback(() => {
    cancelledRef.current = false;
    blurHandledRef.current = false;
  }, []);

  return {
    draft,
    setDraft,
    cancelledRef,
    blurHandledRef,
    handleBlur,
    handleEscape,
    resetGuards,
  };
}
