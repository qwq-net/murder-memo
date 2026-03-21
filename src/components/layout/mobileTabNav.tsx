import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';

const PANEL_LABELS: Record<PanelId, string> = {
  free:     'フリーメモ',
  personal: '自分用',
  timeline: 'タイムライン',
};

const PANEL_ACCENT: Record<PanelId, string> = {
  free:     'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export function MobileTabNav() {
  const active = useStore((s) => s.activePanel);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const order = useStore((s) => s.layout.order);

  return (
    <nav
      role="tablist"
      aria-label="パネル切替"
      style={{
        display: 'flex',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        height: 48,
        flexShrink: 0,
      }}
    >
      {order.map((id) => {
        const isActive = active === id;
        const accent = PANEL_ACCENT[id];
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActivePanel(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12,
              letterSpacing: '0.04em',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: accent,
                  borderRadius: '0 0 2px 2px',
                }}
              />
            )}
            <span style={{ fontSize: 12 }}>{PANEL_LABELS[id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
