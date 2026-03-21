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
    <div className="flex flex-col h-full bg-bg-panel overflow-hidden">
      {/* パネルヘッダー */}
      <div
        className="flex items-center justify-between gap-2 px-3 border-b border-border-subtle bg-bg-surface select-none"
        style={{ height: 'var(--panel-header-h)', minHeight: 'var(--panel-header-h)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="shrink-0"
            style={{ width: 3, height: 14, borderRadius: 'var(--radius-sm)', background: accent }}
          />
          <span className="text-xs font-medium text-text-secondary tracking-wide">
            {title}
          </span>
        </div>
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
