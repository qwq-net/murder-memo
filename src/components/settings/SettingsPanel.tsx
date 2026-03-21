import { useCallback, useState } from 'react';

import { useStore } from '../../store';
import type { AppSettings } from '../../store/slices/settings';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '../../types/memo';
import { CharacterBadge } from '../characters/CharacterBadge';
import { MinimalSlot } from '../characters/CharacterBadgeBar';
import { ConfirmModal } from '../common/ConfirmModal';

/* ── Segmented Control ────────────────────────────────────────────────────── */

interface RadioOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  stretch,
}: {
  options: RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** true: 均等幅で親を埋める / false: コンテンツ幅（デフォルト） */
  stretch?: boolean;
}) {
  return (
    <div
      style={{
        display: stretch ? 'flex' : 'inline-flex',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            style={{
              flex: stretch ? 1 : undefined,
              background: active ? 'rgba(196, 90, 42, 0.15)' : 'transparent',
              border: 'none',
              borderLeft: i > 0 ? '1px solid var(--border-default)' : 'none',
              color: opt.disabled
                ? 'var(--text-muted)'
                : active
                  ? '#c45a2a'
                  : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              padding: stretch ? '5px 0' : '5px 14px',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.12s, color 0.12s',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

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
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>非表示</span>
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
        {MOCK_CHARACTERS.map((c) => {
          const badge = (
            <CharacterBadge
              key={c.name}
              color={c.color}
              name={c.name}
              isActive={c.active}
              onClick={() => {}}
              format={format}
            />
          );

          if (isMinimal) {
            return (
              <MinimalSlot key={c.name} revealed={hovered || c.active} isActive={c.active}>
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
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.06em',
        }}
      >
        {children}
      </span>
      {hint && (
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
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
            fontSize: 11,
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
  free: '自由メモ',
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
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{hint}</span>
        )}
      </div>

      {/* format + mode in 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {/* format column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>形式</span>
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
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>モード</span>
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleClearSession = useCallback(async () => {
    await clearCurrentSession();
    setOpen(false);
  }, [clearCurrentSession, setOpen]);

  const handleDeleteSession = useCallback(async () => {
    if (!activeSessionId) return;
    await removeSession(activeSessionId);
    setOpen(false);
  }, [activeSessionId, removeSession, setOpen]);

  if (!isOpen) return null;

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
    <div
      onClick={() => { if (!showClearConfirm && !showDeleteConfirm) setOpen(false); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
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
                free:     { format: 'full', visibility: 'always' },
                timeline: { format: 'full', visibility: 'minimal' },
                personal: { format: 'full', visibility: 'off' },
              })}
              resetDisabled={
                settings.defaultCharacterDisplay.free.format === 'full' &&
                settings.defaultCharacterDisplay.free.visibility === 'always' &&
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
              { panel: 'free' as PanelId, label: '自由メモ' },
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                すべてのメモ・登場人物・メモグループ・画像データを削除します。セッション自体は残ります。
              </span>
              <div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--danger)',
                    fontSize: 12,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg-base)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--danger)'; }}
                >
                  初期化する
                </button>
              </div>
            </div>

            {/* 削除 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                セッションとそのデータをすべて削除します。
              </span>
              <div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={sessions.length <= 1}
                  style={{
                    background: 'none',
                    border: `1px solid ${sessions.length <= 1 ? 'var(--border-subtle)' : 'var(--danger)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: sessions.length <= 1 ? 'var(--text-faint)' : 'var(--danger)',
                    fontSize: 12,
                    padding: '6px 14px',
                    cursor: sessions.length <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    opacity: sessions.length <= 1 ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (sessions.length > 1) { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg-base)'; } }}
                  onMouseLeave={(e) => { if (sessions.length > 1) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--danger)'; } }}
                >
                  セッションを削除
                </button>
                {sessions.length <= 1 && (
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>
                    最後のセッションは削除できません
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="現在のセッションを初期化しますか？"
        confirmationLabel="すべてのメモ・登場人物・画像データが削除されます。この操作は取り消せません。"
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
        confirmationLabel="セッションとそのすべてのデータが完全に削除されます。この操作は取り消せません。"
        actions={[{
          label: '削除する',
          color: 'var(--danger)',
          requiresConfirmation: true,
          onClick: handleDeleteSession,
        }]}
      />
    </div>
  );
}
