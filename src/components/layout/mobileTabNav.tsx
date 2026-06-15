import { useMemo } from 'react';

import { useT } from '@/i18n';
import { visiblePanels } from '@/lib/panelLayout';
import { PANEL_ACCENT } from '@/lib/panelMeta';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';
import type { PanelId } from '@/types/memo';

export function MobileTabNav() {
  const t = useT();
  const active = useStore((s) => s.activePanel);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const layout = useStore(selectResolvedLayout);
  // 非表示パネルはタブにも出さない（activePanel が非表示を指さないことは
  // store/index.ts の activePanel ガードが保証する）
  const order = useMemo(() => visiblePanels(layout), [layout]);

  // NOTE: モバイルタブのラベルは personal が layout.tab.personal（panels.personal より短縮）
  // のため、panels.* キーは使わず layout.tab.* を使う
  const tabLabel = (id: PanelId): string => t(`layout.tab.${id}` as Parameters<typeof t>[0]);

  return (
    <nav
      role="tablist"
      aria-label={t('layout.mobileTabNav')}
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
              fontSize: 14,
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
            <span style={{ fontSize: 14 }}>{tabLabel(id)}</span>
          </button>
        );
      })}
    </nav>
  );
}
