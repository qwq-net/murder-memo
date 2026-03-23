import { useCallback, useMemo, useRef } from 'react';

import { EXPORT_WARN_BYTES, downloadJson, estimateExportSize, exportSession, formatBytes, importSession } from '@/lib/exportImport';
import { copyToClipboard, formatSessionAsText } from '@/lib/textExport';
import { useStore } from '@/store';
import type { GameSession, PanelId } from '@/types/memo';
import { ConfirmModal } from '@/components/common/confirmModal';
import { PANEL_CARD_ACCENT } from '@/components/settings/markerCard';
import { PANEL_ORDER_LABELS } from '@/components/settings/panelOrderEditor';
import { SectionHeader } from '@/components/settings/sectionHeader';

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
  panelOrder: [PanelId, PanelId, PanelId];
  addToast: (msg: string, variant?: 'info' | 'success' | 'error') => void;
  setOpen: (v: boolean) => void;
  showExportConfirm: boolean;
  setShowExportConfirm: (v: boolean) => void;
  exportSizeInfo: string;
  setExportSizeInfo: (v: string) => void;
}) {
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
      addToast('バックアップをダウンロードしました', 'success');
    } catch {
      addToast('エクスポートに失敗しました', 'error');
    }
  }, [sessions, activeSessionId, addToast]);

  const handleExportBackup = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      const { imageCount, totalBytes } = await estimateExportSize(activeSessionId);
      if (totalBytes > EXPORT_WARN_BYTES) {
        setExportSizeInfo(
          `画像 ${imageCount} 枚（推定 ${formatBytes(totalBytes)}）を含みます。\nファイルが大きいため、エクスポートに時間がかかる場合があります。`,
        );
        setShowExportConfirm(true);
      } else {
        await doExport();
      }
    } catch {
      addToast('エクスポートに失敗しました', 'error');
    }
  }, [activeSessionId, doExport, addToast, setExportSizeInfo, setShowExportConfirm]);

  const handleImportBackup = useCallback(async (file: File) => {
    try {
      const { pause, resume, clear } = useStore.temporal.getState();
      pause();
      const newSession = await importSession(file);
      const { sessions: current } = useStore.getState();
      useStore.setState({
        sessions: [...current, newSession],
        activeSessionId: newSession.id,
      });
      clear();
      resume();
      addToast(`「${newSession.name}」をインポートしました`, 'success');
      setOpen(false);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'インポートに失敗しました', 'error');
    }
  }, [addToast, setOpen]);

  const handleTextExport = useCallback(async (panelFilter?: PanelId) => {
    const { entries, characters, timelineGroups, memoGroups, settings: s } = useStore.getState();
    const session = sessions.find((ss) => ss.id === activeSessionId);
    if (!session) return;
    const text = formatSessionAsText(
      session.name,
      entries,
      characters,
      timelineGroups,
      memoGroups,
      s.panelOrder,
      panelFilter,
    );
    if (!text) {
      addToast('エクスポートするメモがありません');
      return;
    }
    const ok = await copyToClipboard(text);
    if (ok) {
      addToast('クリップボードにコピーしました', 'success');
    } else {
      addToast('コピーに失敗しました', 'error');
    }
  }, [sessions, activeSessionId, addToast]);

  return (
    <>
      {/* ── テキストエクスポート ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
        <SectionHeader>テキストエクスポート</SectionHeader>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          メモ内容を Markdown テキストとしてクリップボードにコピーします。
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => handleTextExport()}
            className="btn-ghost btn-sm"
          >
            全パネル
          </button>
          {panelOrder.map((p) => (
            <button
              key={p}
              onClick={() => handleTextExport(p)}
              className="btn-ghost btn-sm"
              style={{ color: PANEL_CARD_ACCENT[p], borderColor: PANEL_CARD_ACCENT[p] }}
            >
              {PANEL_ORDER_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── バックアップ ── */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
        <SectionHeader>バックアップ</SectionHeader>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          現在のセッションのデータを JSON ファイルとしてエクスポート、またはファイルからインポートして復元します。
        </span>

        {/* 統計 */}
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
          <span>メモ {stats.total} 件</span>
          <span>画像 {stats.imageCount} 件</span>
          <span>登場人物 {stats.characterCount} 人</span>
        </div>

        {stats.imageCount > 100 && (
          <div style={{
            fontSize: 14,
            color: 'var(--importance-medium)',
            lineHeight: 1.6,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--importance-medium) 10%, transparent)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 7v4M8 5.5v-.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>
              画像が {stats.imageCount} 件あります。エクスポート時にファイルが大きくなったり、インポート時にデータが破損するおそれがあります。
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={handleExportBackup}
            className="btn-ghost btn-sm"
          >
            エクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost btn-sm"
          >
            インポート
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
        title="エクスポートファイルが大きくなります"
        confirmationLabel={exportSizeInfo}
        actions={[{
          label: 'エクスポートする',
          requiresConfirmation: true,
          onClick: doExport,
        }]}
      />
    </>
  );
}
