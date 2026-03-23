import { useState } from 'react';

import { CharacterBadge } from '@/components/characters/characterBadge';
import { MinimalSlot } from '@/components/characters/characterBadgeBar';
import { RadioGroup } from '@/components/common/radioGroup';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, PanelId } from '@/types/memo';

/* ── 共通定数 ─────────────────────────────────────────────────────────────── */

export const PANEL_CARD_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  timeline: 'var(--panel-timeline-accent)',
  personal: 'var(--panel-personal-accent)',
};

const VISIBILITY_HINTS: Record<CharacterDisplayVisibility, string | null> = {
  always: null,
  minimal: 'ホバー / 編集中に全表示',
  off: null,
};

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
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>非表示</span>
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
              onClick={() => { /* プレビュー用: 操作なし */ }}
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
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{hint}</span>
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
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>形式</span>
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
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>モード</span>
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
