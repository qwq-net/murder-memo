import { useCallback } from 'react';

import { destroyDatabase } from '@/lib/idb';
import { useStore } from '@/store';
import type { GameSession } from '@/types/memo';
import { ConfirmModal } from '@/components/common/confirmModal';
import { SectionHeader } from '@/components/settings/sectionHeader';

export function SessionManagementSection({
  sessions,
  activeSessionId,
  isDemo,
  addToast,
  setOpen,
  showClearConfirm,
  setShowClearConfirm,
  showDeleteConfirm,
  setShowDeleteConfirm,
  showResetAllConfirm,
  setShowResetAllConfirm,
}: {
  sessions: GameSession[];
  activeSessionId: string | null;
  isDemo: boolean;
  addToast: (msg: string, variant?: 'info' | 'success' | 'error') => void;
  setOpen: (v: boolean) => void;
  showClearConfirm: boolean;
  setShowClearConfirm: (v: boolean) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  showResetAllConfirm: boolean;
  setShowResetAllConfirm: (v: boolean) => void;
}) {
  const clearCurrentSession = useStore((s) => s.clearCurrentSession);
  const removeSession = useStore((s) => s.removeSession);

  const handleClearSession = useCallback(async () => {
    const { pause, resume, clear } = useStore.temporal.getState();
    pause();
    await clearCurrentSession();
    clear();
    resume();
    addToast('セッションを初期化しました');
    setOpen(false);
  }, [clearCurrentSession, addToast, setOpen]);

  const handleDeleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    const { pause, resume, clear } = useStore.temporal.getState();
    pause();
    await removeSession(activeSessionId);
    clear();
    resume();
    addToast('セッションを削除しました');
    setOpen(false);
  }, [activeSessionId, removeSession, addToast, setOpen]);

  const handleResetAll = useCallback(async () => {
    localStorage.clear();
    await destroyDatabase();
    location.reload();
  }, []);

  return (
    <>
      {/* ── 現在のセッション ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
        <SectionHeader>現在のセッション</SectionHeader>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 初期化 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            すべてのメモ・登場人物・メモグループ・画像データを削除します。セッション自体は残ります。
          </span>
          <div>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isDemo}
              className="btn-danger btn-lg"
            >
              初期化する
            </button>
            {isDemo && (
              <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                サンプルシナリオは初期化できません
              </span>
            )}
          </div>
        </div>

        {/* 削除 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            セッションとそのデータをすべて削除します。
          </span>
          <div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDemo || sessions.length <= 1}
              className="btn-danger btn-lg"
            >
              セッションを削除
            </button>
            {isDemo ? (
              <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                サンプルシナリオは削除できません
              </span>
            ) : sessions.length <= 1 && (
              <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                最後のセッションは削除できません
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 完全リセット ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
        <SectionHeader>完全リセット</SectionHeader>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          すべてのセッション・設定・保存データを完全に削除し、アプリを初期状態に戻します。
        </span>
        <div>
          <button
            onClick={() => setShowResetAllConfirm(true)}
            className="btn-danger btn-lg"
          >
            完全リセット
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="現在のセッションを初期化しますか？"
        confirmationLabel="すべてのメモ・登場人物・画像データが削除されることを理解しました"
        actions={[{
          label: '初期化する',
          color: 'var(--danger)',
          requiresConfirmation: true,
          onClick: handleClearSession,
        }]}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="現在のセッションを削除しますか？"
        confirmationLabel="セッションとそのすべてのデータが完全に削除されることを理解しました"
        actions={[{
          label: '削除する',
          color: 'var(--danger)',
          requiresConfirmation: true,
          onClick: handleDeleteSession,
        }]}
      />

      <ConfirmModal
        open={showResetAllConfirm}
        onClose={() => setShowResetAllConfirm(false)}
        title="アプリを完全にリセットしますか？"
        confirmationLabel="すべてのセッション・メモ・登場人物・設定・画像データが完全に削除されることを理解しました"
        actions={[{
          label: '完全リセット',
          color: 'var(--danger)',
          requiresConfirmation: true,
          onClick: handleResetAll,
        }]}
      />
    </>
  );
}
