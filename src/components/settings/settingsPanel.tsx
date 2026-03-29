import { useState } from 'react';

import { useStore } from '@/store';
import type { AppSettings } from '@/store/slices/settings';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';
import { BackupSection } from '@/components/settings/backupSection';
import { MarkerCard } from '@/components/settings/markerCard';
import { PanelOrderEditor } from '@/components/settings/panelOrderEditor';
import { SectionHeader } from '@/components/settings/sectionHeader';
import { SessionManagementSection } from '@/components/settings/sessionManagementSection';
import { SettingRow } from '@/components/settings/settingRow';

export function SettingsPanel() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const addToast = useStore((s) => s.addToast);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const isDemo = sessions.find((s) => s.id === activeSessionId)?.isDemo ?? false;

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exportSizeInfo, setExportSizeInfo] = useState('');

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings({ [key]: value });
  };

  const updateMarker = (panel: PanelId, patch: Partial<{ format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility }>) => {
    updateSettings({
      defaultCharacterDisplay: {
        ...settings.defaultCharacterDisplay,
        [panel]: { ...settings.defaultCharacterDisplay[panel], ...patch },
      },
    });
  };

  // ConfirmModal が開いているときはモーダル背景クリックで閉じない
  const hasSubModal = showClearConfirm || showDeleteConfirm || showResetAllConfirm || showExportConfirm;

  return (
    <>
    <ModalFrame
      open={isOpen}
      onClose={() => { if (!hasSubModal) setOpen(false); }}
      width={480}
      ariaLabel="アプリ設定"
    >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 10px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            アプリ設定
          </span>
          <button onClick={() => setOpen(false)} className="modal-close-btn" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '2px 18px 18px' }}>

          {/* ── 一般 ── */}
          <SectionHeader>一般</SectionHeader>

          <SettingRow
            label="言語"
            value={settings.language}
            onChange={(v) => update('language', v)}
            options={[
              { value: 'ja', label: '日本語' },
              { value: 'en', label: 'English', disabled: true },
            ]}
          />
          <SettingRow
            label="テーマ"
            value={settings.theme}
            onChange={(v) => update('theme', v)}
            options={[
              { value: 'auto', label: '自動' },
              { value: 'dark', label: 'ダーク' },
              { value: 'light', label: 'ライト' },
            ]}
          />
          <SettingRow
            label="入力欄の位置"
            value={settings.inputPosition}
            onChange={(v) => update('inputPosition', v)}
            options={[
              { value: 'top', label: '上部' },
              { value: 'bottom', label: '下部' },
            ]}
          />

          {/* ── パネル表示順 ── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
            <SectionHeader
              hint="左から順に並びます"
              onReset={() => update('panelOrder', ['free', 'timeline', 'personal'])}
              resetDisabled={
                settings.panelOrder[0] === 'free' &&
                settings.panelOrder[1] === 'timeline' &&
                settings.panelOrder[2] === 'personal'
              }
            >
              パネル表示順
            </SectionHeader>
          </div>

          <PanelOrderEditor
            order={settings.panelOrder}
            onChange={(newOrder) => update('panelOrder', newOrder)}
          />

          {/* ── 関連人物マーカー ── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
            <SectionHeader
              onReset={() => update('defaultCharacterDisplay', {
                free:     { format: 'full', visibility: 'minimal' },
                timeline: { format: 'full', visibility: 'minimal' },
                personal: { format: 'full', visibility: 'off' },
              })}
              resetDisabled={
                settings.defaultCharacterDisplay.free.format === 'full' &&
                settings.defaultCharacterDisplay.free.visibility === 'minimal' &&
                settings.defaultCharacterDisplay.timeline.format === 'full' &&
                settings.defaultCharacterDisplay.timeline.visibility === 'minimal' &&
                settings.defaultCharacterDisplay.personal.format === 'full' &&
                settings.defaultCharacterDisplay.personal.visibility === 'off'
              }
            >
              関連人物マーカー（デフォルト）
            </SectionHeader>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { panel: 'free' as PanelId, label: 'フリーメモ' },
              { panel: 'timeline' as PanelId, label: 'タイムライン' },
              { panel: 'personal' as PanelId, label: '自分用メモ' },
            ]).map(({ panel, label }) => (
              <MarkerCard
                key={panel}
                panel={panel}
                label={label}
                settings={settings.defaultCharacterDisplay[panel]}
                onChangeFormat={(v) => updateMarker(panel, { format: v })}
                onChangeVisibility={(v) => updateMarker(panel, { visibility: v })}
              />
            ))}
          </div>

          <BackupSection
            sessions={sessions}
            activeSessionId={activeSessionId}
            panelOrder={settings.panelOrder}
            addToast={addToast}
            setOpen={setOpen}
            showExportConfirm={showExportConfirm}
            setShowExportConfirm={setShowExportConfirm}
            exportSizeInfo={exportSizeInfo}
            setExportSizeInfo={setExportSizeInfo}
          />

          <SessionManagementSection
            sessions={sessions}
            activeSessionId={activeSessionId}
            isDemo={isDemo}
            addToast={addToast}
            setOpen={setOpen}
            showClearConfirm={showClearConfirm}
            setShowClearConfirm={setShowClearConfirm}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            showResetAllConfirm={showResetAllConfirm}
            setShowResetAllConfirm={setShowResetAllConfirm}
          />
        </div>
    </ModalFrame>
    </>
  );
}
