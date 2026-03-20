import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';

const TABS: { id: PanelId; label: string }[] = [
  { id: 'free',     label: '自由メモ' },
  { id: 'personal', label: '自分用'   },
  { id: 'timeline', label: 'タイムライン' },
];

const PANEL_ACCENT: Record<PanelId, string> = {
  free:     'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export function MobileTabNav() {
  const active = useStore((s) => s.activePanel);
  const setActivePanel = useStore((s) => s.setActivePanel);

  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        height: 48,
        flexShrink: 0,
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const accent = PANEL_ACCENT[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
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
              fontSize: 10,
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
            <span style={{ fontSize: 11 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
