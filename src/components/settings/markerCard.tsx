import { useState } from 'react';

import { CharacterBadge } from '@/components/characters/characterBadge';
import { MinimalSlot } from '@/components/characters/characterBadgeBar';
import { ColorDot } from '@/components/common/colorDot';
import { RadioGroup } from '@/components/common/radioGroup';
import { PANEL_CARD_ACCENT } from '@/components/settings/panelConstants';
import { useT } from '@/i18n';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';

/* ── Marker Preview ───────────────────────────────────────────────────────── */

const PREVIEW_HEIGHT = 30;

function MarkerPreview({
  format,
  visibility,
}: {
  format: CharacterDisplayFormat;
  visibility: CharacterDisplayVisibility;
}) {
  const t = useT();
  const [hovered, setHovered] = useState(false);

  // デモキャラクター名は t() で言語ごとに切替
  const mockCharacters = [
    { name: t('settings.mockDoctor'), color: '#e74c3c', active: true },
    { name: t('settings.mockButler'), color: '#3498db', active: true },
    { name: t('settings.mockLady'), color: '#2ecc71', active: false },
    { name: t('settings.mockDetective'), color: '#f39c12', active: true },
    { name: t('settings.mockGardener'), color: '#9b59b6', active: false },
  ];

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
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {t('settings.markerVisibilityOffPreview')}
        </span>
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
        {mockCharacters.map((c) => {
          const badge = (
            <CharacterBadge
              key={c.name}
              color={c.color}
              name={c.name}
              isActive={c.active}
              onClick={() => {
                /* プレビュー用: 操作なし */
              }}
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

/* ── Marker Card ──────────────────────────────────────────────────────────── */

export function MarkerCard({
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
  const t = useT();
  const accent = PANEL_CARD_ACCENT[panel];

  // 表示モード別のヒントテキスト（minimal のみ表示、null は非表示）
  const visibilityHints: Record<CharacterDisplayVisibility, string | null> = {
    always: null,
    minimal: t('settings.markerVisibilityMinimalHint'),
    off: null,
  };
  const hint = visibilityHints[settings.visibility];

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
        <ColorDot color={accent} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            {hint}
          </span>
        )}
      </div>

      {/* format + mode の 2 カラム */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {/* format column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('settings.markerFormat')}
          </span>
          <RadioGroup<CharacterDisplayFormat>
            stretch
            options={[
              { value: 'full', label: t('settings.markerFormatFull') },
              { value: 'badge', label: t('settings.markerFormatBadge') },
              { value: 'text', label: t('settings.markerFormatText') },
            ]}
            value={settings.format}
            onChange={onChangeFormat}
          />
        </div>

        {/* mode column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('settings.markerMode')}
          </span>
          <RadioGroup<CharacterDisplayVisibility>
            stretch
            options={[
              { value: 'always', label: t('settings.markerVisibilityAlways') },
              { value: 'minimal', label: t('settings.markerVisibilityMinimal') },
              { value: 'off', label: t('settings.markerVisibilityOff') },
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
