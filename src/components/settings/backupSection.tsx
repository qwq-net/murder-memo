import { useCallback, useMemo, useRef } from 'react';

import { ConfirmModal } from '@/components/common/confirmModal';
import { PANEL_CARD_ACCENT } from '@/components/settings/panelConstants';
import { SectionHeader } from '@/components/settings/sectionHeader';
import { useT } from '@/i18n';
import {
  EXPORT_WARN_BYTES,
  downloadJson,
  estimateExportSize,
  exportSession,
  formatBytes,
  importSession,
} from '@/lib/exportImport';
import { copyToClipboard, formatSessionAsText } from '@/lib/textExport';
import { useStore } from '@/store';
import type { GameSession, PanelId } from '@/types/memo';

export function BackupSection({
  sessions,
  activeSessionId,
  panelOrder,
  addToast,
  setOpen,
  showExportConfirm,
  setShowExportConfirm,
  exportSizeInfo,
  setExportSizeInfo,
}: {
  sessions: GameSession[];
  activeSessionId: string | null;
  /** テキスト出力のパネル順（表示順 → 非表示の全パネル。fullPanelOrder で導出） */
  panelOrder: PanelId[];
  addToast: (msg: string, variant?: 'info' | 'success' | 'error') => void;
  setOpen: (v: boolean) => void;
  showExportConfirm: boolean;
  setShowExportConfirm: (v: boolean) => void;
  exportSizeInfo: string;
  setExportSizeInfo: (v: string) => void;
}) {
  const t = useT();
  const entries = useStore((s) => s.entries);
  const characters = useStore((s) => s.characters);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const imageCount = entries.filter((e) => e.type === 'image').length;
    return { total: entries.length, imageCount, characterCount: characters.length };
  }, [entries, characters]);

  const doExport = useCallback(async () => {
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;
    try {
      const data = await exportSession(session);
      downloadJson(data);
      addToast(t('settings.backupDownloaded'), 'success');
    } catch {
      addToast(t('settings.exportFailed'), 'error');
    }
  }, [sessions, activeSessionId, addToast, t]);

  const handleExportBackup = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      const { imageCount, totalBytes } = await estimateExportSize(activeSessionId);
      if (totalBytes > EXPORT_WARN_BYTES) {
        setExportSizeInfo(
          t('settings.exportLargeImageInfo', { n: imageCount, size: formatBytes(totalBytes) }),
        );
        setShowExportConfirm(true);
      } else {
        await doExport();
      }
    } catch {
      addToast(t('settings.exportFailed'), 'error');
    }
  }, [activeSessionId, doExport, addToast, setExportSizeInfo, setShowExportConfirm, t]);

  const handleImportBackup = useCallback(
    async (file: File) => {
      const { setSessionReady } = useStore.getState();
      // ファイル読み込み・IDB 書き込み・画像復元が完了するまで UI 操作を不能にする
      // （途中状態でメモを編集してインポートデータと混ざるのを防ぐ）。
      setSessionReady(false);
      const { pause, resume, clear } = useStore.temporal.getState();
      pause();
      try {
        const newSession = await importSession(file);
        const { sessions: current } = useStore.getState();
        // セッション切替を伴う setState。store/index.ts の subscribe フックが発火し、
        // 切替先セッションのデータ再ロード + ローディング解除を担う。
        useStore.setState({
          sessions: [...current, newSession],
          activeSessionId: newSession.id,
        });
        clear();
        addToast(
          t('settings.sessionImported', { name: t('common.quoted', { label: newSession.name }) }),
          'success',
        );
        setOpen(false);
      } catch (e) {
        addToast(e instanceof Error ? e.message : t('settings.importFailed'), 'error');
        // 失敗時は subscribe フックが発火しないため、ここでローディングを解除する必要がある
        setSessionReady(true);
      } finally {
        resume();
      }
    },
    [addToast, setOpen, t],
  );

  const handleTextExport = useCallback(
    async (panelFilter?: PanelId) => {
      const { entries, characters, timelineGroups, memoGroups } = useStore.getState();
      const session = sessions.find((ss) => ss.id === activeSessionId);
      if (!session) return;
      const text = formatSessionAsText(
        session.name,
        entries,
        characters,
        timelineGroups,
        memoGroups,
        panelOrder,
        panelFilter,
      );
      if (!text) {
        addToast(t('settings.noMemoToExport'));
        return;
      }
      const ok = await copyToClipboard(text);
      if (ok) {
        addToast(t('settings.copiedToClipboard'), 'success');
      } else {
        addToast(t('settings.copyFailed'), 'error');
      }
    },
    [sessions, activeSessionId, panelOrder, addToast, t],
  );

  return (
    <>
      {/* ── テキストエクスポート ── */}
      <SectionHeader divider>{t('settings.textExport')}</SectionHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {t('settings.textExportDescription')}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={() => handleTextExport()} className="btn-ghost btn-sm">
            {t('settings.allPanels')}
          </button>
          {panelOrder.map((p) => (
            <button
              key={p}
              onClick={() => handleTextExport(p)}
              className="btn-ghost btn-sm"
              style={{ color: PANEL_CARD_ACCENT[p], borderColor: PANEL_CARD_ACCENT[p] }}
            >
              {t(`panels.${p}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      {/* ── バックアップ ── */}
      <SectionHeader divider>{t('settings.backup')}</SectionHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {t('settings.backupDescription')}
        </span>

        {/* 統計 */}
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
          <span>{t('settings.memoCount', { n: stats.total })}</span>
          <span>{t('settings.imageCount', { n: stats.imageCount })}</span>
          <span>{t('settings.characterCount', { n: stats.characterCount })}</span>
        </div>

        {stats.imageCount > 100 && (
          <div
            style={{
              fontSize: 14,
              color: 'var(--importance-medium)',
              lineHeight: 1.6,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--importance-medium) 10%, transparent)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 7v4M8 5.5v-.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{t('settings.manyImagesWarning', { n: stats.imageCount })}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={handleExportBackup} className="btn-ghost btn-sm">
            {t('settings.exportButton')}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost btn-sm">
            {t('settings.importButton')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportBackup(file);
              // 同じファイルを再選択可能にする
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <ConfirmModal
        open={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        title={t('settings.exportLargeTitle')}
        confirmationLabel={exportSizeInfo}
        actions={[
          {
            label: t('settings.doExport'),
            requiresConfirmation: true,
            onClick: doExport,
          },
        ]}
      />
    </>
  );
}
