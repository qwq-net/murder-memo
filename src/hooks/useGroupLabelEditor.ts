import { useCallback, useState } from 'react';

interface UseGroupLabelEditorParams {
  initialLabel: string;
  onSave: (label: string) => void;
}

/**
 * グループラベル編集のステート管理を共通化するフック。
 * MemoGroupSection と TimelineGroupSection で利用。
 */
export function useGroupLabelEditor({ initialLabel, onSave }: UseGroupLabelEditorParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(initialLabel);

  const startEditing = useCallback(() => {
    setDraftLabel(initialLabel);
    setIsEditing(true);
  }, [initialLabel]);

  const saveLabel = useCallback(() => {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== initialLabel) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [draftLabel, initialLabel, onSave]);

  const cancelEditing = useCallback(() => {
    setDraftLabel(initialLabel);
    setIsEditing(false);
  }, [initialLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveLabel();
      if (e.key === 'Escape') cancelEditing();
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
