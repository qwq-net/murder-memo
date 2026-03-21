import { useCallback, useState } from 'react';

/**
 * 削除確認モーダルの表示判定を共通化するフック。
 * アイテムがある場合はモーダルを表示、空なら即削除。
 */
export function useDeleteWithConfirmation(hasItems: boolean, onDelete: () => void) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const requestDelete = useCallback(() => {
    if (hasItems) {
      setIsModalOpen(true);
    } else {
      onDelete();
    }
  }, [hasItems, onDelete]);

  return { isModalOpen, closeModal, requestDelete };
}
