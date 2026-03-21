import type { ReactNode } from 'react';

import type { PanelId } from '../../types/memo';

interface PanelProps {
  panelId: PanelId;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PANEL_ACCENT: Record<PanelId, string> = {
  free:     'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export function Panel({ panelId, title, actions, children }: PanelProps) {
  const accent = PANEL_ACCENT[panelId];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-panel)',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          height: 'var(--panel-header-h)',
          minHeight: 'var(--panel-header-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 3,
              height: 14,
              borderRadius: 'var(--radius-sm)',
              background: accent,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em',
              userSelect: 'none',
            }}
          >
            {title}
          </span>
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
