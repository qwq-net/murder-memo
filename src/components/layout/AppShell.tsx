import { useEffect, useState } from 'react';

import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';
import { CharacterSetupPanel } from '../characters/CharacterSetupPanel';
import { FreeMemoPanel } from '../panels/FreeMemoPanel';
import { PersonalMemoPanel } from '../panels/PersonalMemoPanel';
import { TimelinePanel } from '../panels/TimelinePanel';
import { MobileTabNav } from './MobileTabNav';
import { Panel } from './Panel';
import { PanelContainer } from './PanelContainer';

const PANEL_CONTENT: Record<PanelId, React.ReactNode> = {
  free:     <FreeMemoPanel />,
  personal: <PersonalMemoPanel />,
  timeline: <TimelinePanel />,
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
  const characters = useStore((s) => s.characters);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // sortOrder順（DnD順）= 行動順
  const actionOrderChars = [...characters].sort((a, b) => a.sortOrder - b.sortOrder);

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
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        {/* ── Row 1: Logo + 登場人物設定 ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            height: 'var(--header-h)',
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
                fontSize: 13,
                color: 'var(--text-primary)',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Murder Memo
            </span>
          </div>

          {/* 登場人物設定ボタン */}
          <button
            onClick={() => setCharacterSetupOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: 12,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            登場人物設定
          </button>
        </div>

        {/* ── Row 2: Session (left) + Action order strip (right) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px 8px',
            gap: 12,
            minHeight: 28,
          }}
        >
          {/* Session switcher */}
          <button
            onClick={() => setSessionSwitcherOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              padding: '0',
              cursor: 'pointer',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 200,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {activeSession?.name ?? 'セッションなし'}
          </button>

          {/* 行動順ストリップ */}
          {actionOrderChars.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                overflow: 'hidden',
              }}
            >
              {actionOrderChars.map((char) => (
                <span
                  key={char.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: char.color, fontSize: 10, lineHeight: 1 }}>●</span>
                  {char.name}
                </span>
              ))}
            </div>
          )}
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
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <PanelContainer panels={orderedPanels} />
        </div>
      )}

      {/* Modals */}
      <CharacterSetupPanel />
    </div>
  );
}

