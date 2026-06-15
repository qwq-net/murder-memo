import { useCallback, useState } from 'react';

import { useT } from '@/i18n';
import { isCancelEscape, isCommitEnter } from '@/lib/keyboardKeys';
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
  const t = useT();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const startRenaming = useCallback(() => {
    const active = sessions.find((s) => s.id === activeSessionId);
    setRenameValue(active?.name ?? '');
    setIsRenaming(true);
  }, [sessions, activeSessionId]);

  const handleBlur = useCallback(() => {
    const trimmed = renameValue.trim();
    setIsRenaming(false);
    if (!trimmed || !activeSessionId) return;
    // 保存成功を待ってからトースト。失敗時は虚偽の成功通知を出さずエラー通知する
    renameSession(activeSessionId, trimmed)
      .then(() => useStore.getState().addToast(t('hooks.session.renamed')))
      .catch((err) => {
        useStore.getState().addToast(t('hooks.session.renameFailed'), 'error');
        console.error('セッション名の変更に失敗しました', err);
      });
  }, [renameValue, activeSessionId, renameSession, t]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // IME 変換確定の Enter で誤って blur（=保存）しないよう isCommitEnter で判定する
    if (isCommitEnter(e)) {
      (e.target as HTMLInputElement).blur();
    } else if (isCancelEscape(e)) {
      setIsRenaming(false);
    }
  }, []);

  return {
    isRenaming,
    renameValue,
    setRenameValue,
    startRenaming,
    handleBlur,
    handleKeyDown,
  };
}
