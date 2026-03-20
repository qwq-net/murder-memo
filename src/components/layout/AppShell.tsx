import { useEffect, useState } from 'react';

import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';
import { FreeMemoPanel } from '../panels/FreeMemoPanel';
import { MobileTabNav } from './MobileTabNav';
import { Panel } from './Panel';
import { PanelContainer } from './PanelContainer';

// 後続TODOで PersonalMemoPanel, TimelinePanel に差し替え
function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-faint)',
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

const PANEL_CONTENT: Record<PanelId, React.ReactNode> = {
  free:     <FreeMemoPanel />,
  personal: <PlaceholderPanel label="ハンドアウトなど" />,
  timeline: <PlaceholderPanel label="時系列整理" />,
};

const PANEL_TITLES: Record<PanelId, string> = {
  free:     '自由メモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

export function AppShell() {
  const order = useStore((s) => s.layout.order);
  const activePanel = useStore((s) => s.activePanel);
  const setCharacterSetupOpen = useStore((s) => s.setCharacterSetupOpen);
  const setSessionSwitcherOpen = useStore((s) => s.setSessionSwitcherOpen);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const orderedPanels = order.map((id) => ({
    id,
    node: (
      <Panel panelId={id} title={PANEL_TITLES[id]}>
        {PANEL_CONTENT[id]}
      </Panel>
    ),
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-base)',
      }}
    >
      {/* ── Global Header ── */}
      <header
        style={{
          height: 'var(--header-h)',
          minHeight: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          gap: 12,
          zIndex: 20,
        }}
      >
        {/* Logo / title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="2" stroke="var(--accent)" strokeWidth="1.2"/>
            <line x1="4" y1="5.5" x2="14" y2="5.5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
            <line x1="4" y1="8.5" x2="11" y2="8.5" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round"/>
            <line x1="4" y1="11.5" x2="13" y2="11.5" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="14" cy="13" r="2.5" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="1"/>
            <line x1="13.3" y1="12.3" x2="14.7" y2="13.7" stroke="var(--accent)" strokeWidth="0.8"/>
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 13,
              color: 'var(--text-primary)',
              letterSpacing: '0.08em',
            }}
          >
            Murder Memo
          </span>
        </div>

        {/* Session name */}
        <button
          onClick={() => setSessionSwitcherOpen(true)}
          style={{
            flex: 1,
            maxWidth: 200,
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'var(--border-default)';
            el.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'var(--border-subtle)';
            el.style.color = 'var(--text-secondary)';
          }}
        >
          {activeSession?.name ?? 'セッションなし'}
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HeaderBtn onClick={() => setCharacterSetupOpen(true)} title="登場人物設定">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </HeaderBtn>
        </div>
      </header>

      {/* ── Panels ── */}
      {isMobile ? (
        <>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {orderedPanels.find((p) => p.id === activePanel)?.node}
          </div>
          <MobileTabNav />
        </>
      ) : (
        <PanelContainer panels={orderedPanels} />
      )}
    </div>
  );
}

function HeaderBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.color = 'var(--text-primary)';
        el.style.borderColor = 'var(--border-default)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.color = 'var(--text-muted)';
        el.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {children}
    </button>
  );
}
