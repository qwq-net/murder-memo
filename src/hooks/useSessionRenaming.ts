import { useCallback, useState } from 'react';

import { useStore } from '@/store';
import type { GameSession } from '@/types/memo';

interface UseSessionRenamingParams {
  sessions: GameSession[];
  activeSessionId: string | null;
  renameSession: (id: string, name: string) => Promise<void>;
}

/**
 * セッション名変更のステート管理を共通化するフック。
 * AppShell のヘッダーで利用。
 */
export function useSessionRenaming({
  sessions,
  activeSessionId,
  renameSession,
}: UseSessionRenamingParams) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const startRenaming = useCallback(() => {
    const active = sessions.find((s) => s.id === activeSessionId);
    setRenameValue(active?.name ?? '');
    setIsRenaming(true);
  }, [sessions, activeSessionId]);

  const handleBlur = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && activeSessionId) {
      renameSession(activeSessionId, trimmed);
      useStore.getState().addToast('セッション名を変更しました');
    }
    setIsRenaming(false);
  }, [renameValue, activeSessionId, renameSession]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        setIsRenaming(false);
      }
    },
    [],
  );

  return {
    isRenaming,
    renameValue,
    setRenameValue,
    startRenaming,
    handleBlur,
    handleKeyDown,
  };
}
