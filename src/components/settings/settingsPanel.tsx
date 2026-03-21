import { useCallback, useState } from 'react';

import { useStore } from '@/store';
import { destroyDatabase } from '@/lib/idb';
import type { AppSettings } from '@/store/slices/settings';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';
import { CharacterBadge } from '@/components/characters/characterBadge';
import { MinimalSlot } from '@/components/characters/characterBadgeBar';
import { ConfirmModal } from '@/components/common/confirmModal';
import { ModalFrame } from '@/components/common/modalFrame';
import { RadioGroup } from '@/components/common/radioGroup';
import type { RadioOption } from '@/components/common/radioGroup';
import { X } from '@/components/icons';

/* RadioGroup は src/components/common/RadioGroup.tsx を使用 */

/* ── Setting Row (一般設定用) ─────────────────────────────────────────────── */

function SettingRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flexShrink: 0 }}>{label}</span>
      <RadioGroup options={options} value={value} onChange={onChange} />
    </div>
  );
}

/* ── Marker Preview ───────────────────────────────────────────────────────── */

const MOCK_CHARACTERS = [
  { name: '医者', color: '#e74c3c', active: true },
  { name: '執事', color: '#3498db', active: true },
  { name: '令嬢', color: '#2ecc71', active: false },
  { name: '探偵', color: '#f39c12', active: true },
  { name: '庭師', color: '#9b59b6', active: false },
];

const PREVIEW_HEIGHT = 30;

function MarkerPreview({
  format,
  visibility,
}: {
  format: CharacterDisplayFormat;
  visibility: CharacterDisplayVisibility;
}) {
  const [hovered, setHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 10px',
    height: PREVIEW_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  };

  if (visibility === 'off') {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>非表示</span>
      </div>
    );
  }

  const isMinimal = visibility === 'minimal';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={containerStyle}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {MOCK_CHARACTERS.map((c, i) => {
          const badge = (
            <CharacterBadge
              key={c.name}
              color={c.color}
              name={c.name}
              isActive={c.active}
              onClick={() => { /* プレビュー用: 操作なし */ }}
              format={format}
            />
          );

          if (isMinimal) {
            return (
              <MinimalSlot key={c.name} revealed={hovered || c.active} isActive={c.active} isFirst={i === 0}>
                {badge}
              </MinimalSlot>
            );
          }

          return badge;
        })}
      </div>
    </div>
  );
}

/* ── Section Header ───────────────────────────────────────────────────────── */

function SectionHeader({
  children,
  hint,
  onReset,
  resetDisabled,
}: {
  children: React.ReactNode;
  hint?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '12px 0 6px',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.06em',
        }}
      >
        {children}
      </span>
      {hint && (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>
          {hint}
        </span>
      )}
      {onReset && (
        <button
          disabled={resetDisabled}
          onClick={onReset}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: resetDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: resetDisabled ? 'default' : 'pointer',
            padding: '0 2px',
            transition: 'color 0.12s',
          }}
        >
          リセット
        </button>
      )}
    </div>
  );
}

/* ── Panel Order Editor ───────────────────────────────────────────────────── */

const PANEL_ORDER_LABELS: Record<PanelId, string> = {
  free: 'フリーメモ',
  timeline: 'タイムライン',
  personal: '自分用メモ',
};

function PanelOrderEditor({
  order,
  onChange,
}: {
  order: [PanelId, PanelId, PanelId];
  onChange: (order: [PanelId, PanelId, PanelId]) => void;
}) {
  const swap = (index: number, direction: -1 | 1) => {
    const newOrder = [...order] as [PanelId, PanelId, PanelId];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    onChange(newOrder);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {order.map((panelId, i) => (
        <div
          key={panelId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
          }}
        >
          {/* accent dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: PANEL_CARD_ACCENT[panelId],
              flexShrink: 0,
            }}
          />

          {/* label */}
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
            {PANEL_ORDER_LABELS[panelId]}
          </span>

          {/* up / down buttons */}
          <button
            disabled={i === 0}
            onClick={() => swap(i, -1)}
            aria-label="上に移動"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: i === 0 ? 'default' : 'pointer',
              color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            disabled={i === order.length - 1}
            onClick={() => swap(i, 1)}
            aria-label="下に移動"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: i === order.length - 1 ? 'default' : 'pointer',
              color: i === order.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Marker Card ──────────────────────────────────────────────────────────── */

const PANEL_CARD_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  timeline: 'var(--panel-timeline-accent)',
  personal: 'var(--panel-personal-accent)',
};

const VISIBILITY_HINTS: Record<CharacterDisplayVisibility, string | null> = {
  always: null,
  minimal: 'ホバー / 編集中に全表示',
  off: null,
};

function MarkerCard({
  panel,
  label,
  settings,
  onChangeFormat,
  onChangeVisibility,
}: {
  panel: PanelId;
  label: string;
  settings: { format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility };
  onChangeFormat: (v: CharacterDisplayFormat) => void;
  onChangeVisibility: (v: CharacterDisplayVisibility) => void;
}) {
  const accent = PANEL_CARD_ACCENT[panel];
  const hint = VISIBILITY_HINTS[settings.visibility];

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '10px 14px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* card title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{hint}</span>
        )}
      </div>

      {/* format + mode in 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {/* format column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>形式</span>
          <RadioGroup<CharacterDisplayFormat>
            stretch
            options={[
              { value: 'full', label: 'フル' },
              { value: 'badge', label: 'バッジ' },
              { value: 'text', label: 'テキスト' },
            ]}
            value={settings.format}
            onChange={onChangeFormat}
          />
        </div>

        {/* mode column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>モード</span>
          <RadioGroup<CharacterDisplayVisibility>
            stretch
            options={[
              { value: 'always', label: '常時' },
              { value: 'minimal', label: 'ミニマル' },
              { value: 'off', label: 'オフ' },
            ]}
            value={settings.visibility}
            onChange={onChangeVisibility}
          />
        </div>
      </div>

      {/* preview */}
      <MarkerPreview format={settings.format} visibility={settings.visibility} />
    </div>
  );
}

/* ── Settings Panel ───────────────────────────────────────────────────────── */

export function SettingsPanel() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const clearCurrentSession = useStore((s) => s.clearCurrentSession);
  const removeSession = useStore((s) => s.removeSession);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const isDemo = sessions.find((s) => s.id === activeSessionId)?.isDemo ?? false;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  const handleClearSession = useCallback(async () => {
    await clearCurrentSession();
    setOpen(false);
  }, [clearCurrentSession, setOpen]);

  const handleDeleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    await removeSession(activeSessionId);
    setOpen(false);
  }, [activeSessionId, removeSession, setOpen]);

  const handleResetAll = useCallback(async () => {
    localStorage.clear();
    await destroyDatabase();
    location.reload();
  }, []);

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

  return (
    <>
    <ModalFrame
      open={isOpen}
      onClose={() => { if (!showClearConfirm && !showDeleteConfirm && !showResetAllConfirm) setOpen(false); }}
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
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '2px 18px 18px' }}>

          {/* ── General ── */}
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
              { value: 'dark', label: 'ダーク' },
              { value: 'light', label: 'ライト', disabled: true },
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

          {/* ── Panel order ── */}
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

          {/* ── Marker defaults ── */}
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

          {/* ── Session management ── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6 }}>
            <SectionHeader>現在のセッション</SectionHeader>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 初期化 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                すべてのメモ・登場人物・メモグループ・画像データを削除します。セッション自体は残ります。
              </span>
              <div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isDemo}
                  style={{
                    background: 'none',
                    border: `1px solid ${isDemo ? 'var(--border-subtle)' : 'var(--danger)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: isDemo ? 'var(--text-faint)' : 'var(--danger)',
                    fontSize: 13,
                    padding: '6px 14px',
                    cursor: isDemo ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: isDemo ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isDemo) { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg-base)'; } }}
                  onMouseLeave={(e) => { if (!isDemo) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--danger)'; } }}
                >
                  初期化する
                </button>
                {isDemo && (
                  <span style={{ fontSize: 13, color: 'var(--text-faint)', marginLeft: 8 }}>
                    サンプルシナリオは初期化できません
                  </span>
                )}
              </div>
            </div>

            {/* 削除 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                セッションとそのデータをすべて削除します。
              </span>
              <div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDemo || sessions.length <= 1}
                  style={{
                    background: 'none',
                    border: `1px solid ${isDemo || sessions.length <= 1 ? 'var(--border-subtle)' : 'var(--danger)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: isDemo || sessions.length <= 1 ? 'var(--text-faint)' : 'var(--danger)',
                    fontSize: 13,
                    padding: '6px 14px',
                    cursor: isDemo || sessions.length <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: isDemo || sessions.length <= 1 ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isDemo && sessions.length > 1) { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg-base)'; } }}
                  onMouseLeave={(e) => { if (!isDemo && sessions.length > 1) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--danger)'; } }}
                >
                  セッションを削除
                </button>
                {isDemo ? (
                  <span style={{ fontSize: 13, color: 'var(--text-faint)', marginLeft: 8 }}>
                    サンプルシナリオは削除できません
                  </span>
                ) : sessions.length <= 1 && (
                  <span style={{ fontSize: 13, color: 'var(--text-faint)', marginLeft: 8 }}>
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
            <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              すべてのセッション・設定・保存データを完全に削除し、アプリを初期状態に戻します。
            </span>
            <div>
              <button
                onClick={() => setShowResetAllConfirm(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: 13,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg-base)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--danger)'; }}
              >
                完全リセット
              </button>
            </div>
          </div>
        </div>
    </ModalFrame>

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
