import { useCallback, useState } from 'react';

import { isCancelEscape, isCommitEnter } from '@/lib/keyboardKeys';
import { useStore } from '@/store';

interface UseGroupLabelEditorParams {
  initialLabel: string;
  onSave: (label: string) => void | Promise<void>;
  /** 保存成功後に表示するトーストメッセージ */
  toastMessage?: string;
}

/**
 * グループラベル編集のステート管理を共通化するフック。
 * MemoGroupSection と TimelineGroupSection で利用。
 */
export function useGroupLabelEditor({
  initialLabel,
  onSave,
  toastMessage,
}: UseGroupLabelEditorParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(initialLabel);

  const startEditing = useCallback(() => {
    setDraftLabel(initialLabel);
    setIsEditing(true);
  }, [initialLabel]);

  const saveLabel = useCallback(async () => {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== initialLabel) {
      await onSave(trimmed);
      if (toastMessage) {
        useStore.getState().addToast(toastMessage);
      }
    }
    setIsEditing(false);
  }, [draftLabel, initialLabel, onSave, toastMessage]);

  const cancelEditing = useCallback(() => {
    setDraftLabel(initialLabel);
    setIsEditing(false);
  }, [initialLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // IME 変換確定の Enter で誤保存しないよう isCommitEnter で判定する
      if (isCommitEnter(e)) saveLabel();
      else if (isCancelEscape(e)) cancelEditing();
    },
    [saveLabel, cancelEditing],
  );

  return {
    isEditing,
    draftLabel,
    setDraftLabel,
    startEditing,
    saveLabel,
    cancelEditing,
    handleKeyDown,
  };
}
