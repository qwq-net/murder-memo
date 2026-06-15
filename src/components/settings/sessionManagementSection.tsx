import { useCallback } from 'react';

import { ConfirmModal } from '@/components/common/confirmModal';
import { SectionHeader } from '@/components/settings/sectionHeader';
import { useT } from '@/i18n';
import { destroyDatabase } from '@/lib/idb';
import { useStore } from '@/store';
import type { GameSession } from '@/types/memo';

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
  const t = useT();
  const clearCurrentSession = useStore((s) => s.clearCurrentSession);
  const removeSession = useStore((s) => s.removeSession);

  const handleClearSession = useCallback(async () => {
    const { pause, resume, clear } = useStore.temporal.getState();
    pause();
    await clearCurrentSession();
    clear();
    resume();
    addToast(t('settings.sessionCleared'));
    setOpen(false);
  }, [clearCurrentSession, addToast, setOpen, t]);

  const handleDeleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    const { pause, resume, clear } = useStore.temporal.getState();
    pause();
    await removeSession(activeSessionId);
    clear();
    resume();
    addToast(t('settings.sessionDeleted'));
    setOpen(false);
  }, [activeSessionId, removeSession, addToast, setOpen, t]);

  const handleResetAll = useCallback(async () => {
    localStorage.clear();
    await destroyDatabase();
    location.reload();
  }, []);

  return (
    <>
      {/* ── 現在のセッション ── */}
      <SectionHeader divider>{t('settings.currentSession')}</SectionHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 初期化 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('settings.clearSessionDescription')}
          </span>
          <div>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isDemo}
              className="btn-danger btn-lg"
            >
              {t('settings.clearSessionButton')}
            </button>
            {isDemo && (
              <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                {t('settings.demoClearDisabled')}
              </span>
            )}
          </div>
        </div>

        {/* 削除 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('settings.deleteSessionDescription')}
          </span>
          <div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDemo || sessions.length <= 1}
              className="btn-danger btn-lg"
            >
              {t('settings.deleteSessionButton')}
            </button>
            {isDemo ? (
              <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                {t('settings.demoDeleteDisabled')}
              </span>
            ) : (
              sessions.length <= 1 && (
                <span style={{ fontSize: 14, color: 'var(--text-faint)', marginLeft: 8 }}>
                  {t('settings.lastSessionDisabled')}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── 完全リセット ── */}
      <SectionHeader divider>{t('settings.fullReset')}</SectionHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {t('settings.fullResetDescription')}
        </span>
        <div>
          <button onClick={() => setShowResetAllConfirm(true)} className="btn-danger btn-lg">
            {t('settings.fullResetButton')}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={t('settings.clearConfirmTitle')}
        confirmationLabel={t('settings.clearConfirmLabel')}
        actions={[
          {
            label: t('settings.clearConfirmAction'),
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: handleClearSession,
          },
        ]}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('settings.deleteConfirmTitle')}
        confirmationLabel={t('settings.deleteConfirmLabel')}
        actions={[
          {
            label: t('settings.deleteConfirmAction'),
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: handleDeleteSession,
          },
        ]}
      />

      <ConfirmModal
        open={showResetAllConfirm}
        onClose={() => setShowResetAllConfirm(false)}
        title={t('settings.resetAllConfirmTitle')}
        confirmationLabel={t('settings.resetAllConfirmLabel')}
        actions={[
          {
            label: t('settings.resetAllConfirmAction'),
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: handleResetAll,
          },
        ]}
      />
    </>
  );
}
