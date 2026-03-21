import { useCallback, useRef, useState } from 'react';

import { useStore } from '@/store';

interface UseEntryDraftParams<T extends Record<string, unknown>> {
  entryId: string;
  currentValues: T;
  isEditing: boolean;
  onSave: (values: T) => void;
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
  // currentValues はオブジェクトなので JSON シリアライズで変更検出
  const serialized = JSON.stringify(currentValues);
  const [prevSyncKey, setPrevSyncKey] = useState({ serialized, isEditing });
  if (serialized !== prevSyncKey.serialized || isEditing !== prevSyncKey.isEditing) {
    setPrevSyncKey({ serialized, isEditing });
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
