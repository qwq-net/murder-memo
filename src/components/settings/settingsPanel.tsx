import { useState } from 'react';

import { ModalFrame } from '@/components/common/modalFrame';
import { ModalHeader } from '@/components/common/modalHeader';
import { BackupSection } from '@/components/settings/backupSection';
import { LayoutEditor } from '@/components/settings/layoutEditor';
import { MarkerCard } from '@/components/settings/markerCard';
import { SectionHeader } from '@/components/settings/sectionHeader';
import { SessionManagementSection } from '@/components/settings/sessionManagementSection';
import { SettingRow } from '@/components/settings/settingRow';
import { useT } from '@/i18n';
import { DEFAULT_PANEL_LAYOUT, fullPanelOrder, layoutsEqual } from '@/lib/panelLayout';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';
import type { AppSettings } from '@/store/slices/settings';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';

export function SettingsPanel() {
  const t = useT();
  const isOpen = useStore((s) => s.isSettingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  // テキスト出力（BackupSection）はアクティブセッションの解決済みレイアウト順で出す
  const resolvedLayout = useStore(selectResolvedLayout);
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

  const updateMarker = (
    panel: PanelId,
    patch: Partial<{ format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility }>,
  ) => {
    updateSettings({
      defaultCharacterDisplay: {
        ...settings.defaultCharacterDisplay,
        [panel]: { ...settings.defaultCharacterDisplay[panel], ...patch },
      },
    });
  };

  // ConfirmModal が開いているときはモーダル背景クリックで閉じない
  const hasSubModal =
    showClearConfirm || showDeleteConfirm || showResetAllConfirm || showExportConfirm;

  // マーカーカードのパネル別ラベル（t が必要なためレンダー時に生成）
  const markerPanels: { panel: PanelId; label: string }[] = [
    { panel: 'free', label: t('panels.free') },
    { panel: 'timeline', label: t('panels.timeline') },
    { panel: 'personal', label: t('panels.personal') },
  ];

  return (
    <>
      <ModalFrame
        open={isOpen}
        onClose={() => {
          if (!hasSubModal) setOpen(false);
        }}
        width={480}
        ariaLabel={t('settings.title')}
      >
        {/* header */}
        <ModalHeader title={t('settings.title')} onClose={() => setOpen(false)} />

        {/* body */}
        <div style={{ padding: '2px 18px 18px' }}>
          {/* ── 一般 ── */}
          <SectionHeader>{t('settings.general')}</SectionHeader>

          <SettingRow
            label={t('settings.language')}
            value={settings.language}
            onChange={(v) => update('language', v)}
            options={[
              { value: 'ja', label: '日本語' },
              { value: 'en', label: 'English' },
            ]}
          />
          <SettingRow
            label={t('settings.theme')}
            value={settings.theme}
            onChange={(v) => update('theme', v)}
            options={[
              { value: 'auto', label: t('settings.themeAuto') },
              { value: 'dark', label: t('settings.themeDark') },
              { value: 'light', label: t('settings.themeLight') },
            ]}
          />
          <SettingRow
            label={t('settings.inputPosition')}
            value={settings.inputPosition}
            onChange={(v) => update('inputPosition', v)}
            options={[
              { value: 'top', label: t('settings.inputTop') },
              { value: 'bottom', label: t('settings.inputBottom') },
            ]}
          />

          {/* ── レイアウト（グローバル: 新規セッションの初期値） ── */}
          <SectionHeader
            divider
            hint={t('settings.layoutHint')}
            onReset={() => update('layout', DEFAULT_PANEL_LAYOUT)}
            resetDisabled={layoutsEqual(settings.layout, DEFAULT_PANEL_LAYOUT)}
          >
            {t('settings.layout')}
          </SectionHeader>

          <LayoutEditor layout={settings.layout} onChange={(l) => update('layout', l)} />

          {/* ── 関連人物マーカー ── */}
          <SectionHeader
            divider
            onReset={() =>
              update('defaultCharacterDisplay', {
                free: { format: 'full', visibility: 'minimal' },
                timeline: { format: 'full', visibility: 'minimal' },
                personal: { format: 'full', visibility: 'off' },
              })
            }
            resetDisabled={
              settings.defaultCharacterDisplay.free.format === 'full' &&
              settings.defaultCharacterDisplay.free.visibility === 'minimal' &&
              settings.defaultCharacterDisplay.timeline.format === 'full' &&
              settings.defaultCharacterDisplay.timeline.visibility === 'minimal' &&
              settings.defaultCharacterDisplay.personal.format === 'full' &&
              settings.defaultCharacterDisplay.personal.visibility === 'off'
            }
          >
            {t('settings.markers')}
          </SectionHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {markerPanels.map(({ panel, label }) => (
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
            panelOrder={fullPanelOrder(resolvedLayout)}
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
