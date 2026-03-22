import { useCallback, useState } from 'react';

import { useStore } from '@/store';

/**
 * 削除確認モーダルの表示判定を共通化するフック。
 * アイテムがある場合はモーダルを表示、空なら即削除。
 * toastMessage を指定するとどちらのパスでも自動的にトースト通知を発火する。
 */
export function useDeleteWithConfirmation(
  hasItems: boolean,
  onDelete: () => void | Promise<void>,
  toastMessage?: string,
) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  /** onDelete + トースト通知をまとめて実行する */
  const executeDelete = useCallback(async () => {
    await onDelete();
    if (toastMessage) {
      useStore.getState().addToast(toastMessage);
    }
  }, [onDelete, toastMessage]);

  const requestDelete = useCallback(() => {
    if (hasItems) {
      setIsModalOpen(true);
    } else {
      executeDelete();
    }
  }, [hasItems, executeDelete]);

  return { isModalOpen, closeModal, requestDelete, executeDelete };
}
