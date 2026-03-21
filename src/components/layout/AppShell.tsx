import { useMemo, useState } from 'react';

import { useResponsive } from '../../hooks/useResponsive';
import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';
import { CharacterSetupPanel } from '../characters/CharacterSetupPanel';
import { useSelection } from '../entries/selection-context';
import { FreeMemoPanel } from '../panels/FreeMemoPanel';
import { SettingsPanel } from '../settings/SettingsPanel';
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
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const switchSession = useStore((s) => s.switchSession);
  const createSession = useStore((s) => s.createSession);
  const renameSession = useStore((s) => s.renameSession);
  const characters = useStore((s) => s.characters);
  const { hasSelection, clearSelection } = useSelection();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const { isMobile } = useResponsive(1024);

  // sortOrder順（DnD順）= 行動順、ロール別
  const plChars = useMemo(
    () => characters.filter((c) => c.role === 'pl').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );
  const npcChars = useMemo(
    () => characters.filter((c) => c.role === 'npc').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );

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
      onClick={() => { if (hasSelection) clearSelection(); }}
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
            <img src="/logo.svg" alt="マダめもくん" width="20" height="20" />
            <span
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              マダめもくん
            </span>
          </div>

          {/* 右側ボタン群 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setCharacterSetupOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            登場人物設定
          </button>

          {/* アプリ設定ボタン */}
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid rgba(196, 90, 42, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: '#c45a2a',
              fontSize: 12,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#d9683a';
              e.currentTarget.style.borderColor = 'rgba(196, 90, 42, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#c45a2a';
              e.currentTarget.style.borderColor = 'rgba(196, 90, 42, 0.4)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.76 2.76l1.06 1.06M10.18 10.18l1.06 1.06M2.76 11.24l1.06-1.06M10.18 3.82l1.06-1.06" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            アプリ設定
          </button>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => {
                  const trimmed = renameValue.trim();
                  if (trimmed && activeSessionId) renameSession(activeSessionId, trimmed);
                  setIsRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false);
                  }
                }}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid #c45a2a',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  padding: '3px 8px',
                  minWidth: 0,
                  maxWidth: 200,
                  outline: 'none',
                }}
              />
            ) : (
              <select
                value={activeSessionId ?? ''}
                onChange={(e) => switchSession(e.target.value)}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  padding: '3px 24px 3px 8px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a89f8a' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  minWidth: 0,
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            {/* Rename */}
            <button
              onClick={() => {
                const active = sessions.find((s) => s.id === activeSessionId);
                setRenameValue(active?.name ?? '');
                setIsRenaming(true);
              }}
              title="セッション名を変更"
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 1.5a2.121 2.121 0 0 1 3 3L5 14l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* New session */}
            <button
              onClick={() => {
                const nums = sessions
                  .map((s) => s.name.match(/^セッション (\d+)$/))
                  .filter(Boolean)
                  .map((m) => Number(m![1]));
                const next = nums.length > 0 ? Math.max(...nums) + 1 : sessions.length + 1;
                createSession(`セッション ${next}`);
              }}
              title="新しいセッション"
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 14,
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'color 0.15s, border-color 0.15s',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              +
            </button>
          </div>

          {/* 行動順ステッパー — PL | NPC */}
          {(plChars.length > 0 || npcChars.length > 0) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                gap: 6,
              }}
            >
              {/* PL */}
              {plChars.map((char, i) => (
                <div
                  key={char.id}
                  style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                >
                  {i > 0 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, margin: '0 2px' }}>
                      <path d="M7 5l5 5-5 5" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: char.color, boxShadow: `0 0 6px ${char.color}44`, flexShrink: 0 }} />
                    {char.name}
                  </span>
                </div>
              ))}

              {/* セパレータ */}
              {plChars.length > 0 && npcChars.length > 0 && (
                <span style={{ color: 'var(--text-faint)', fontSize: 11, margin: '0 4px', flexShrink: 0 }}>|</span>
              )}

              {/* NPC */}
              {npcChars.map((char, i) => (
                <div
                  key={char.id}
                  style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                >
                  {i > 0 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, margin: '0 2px' }}>
                      <path d="M7 5l5 5-5 5" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: char.color, boxShadow: `0 0 6px ${char.color}44`, flexShrink: 0, opacity: 0.7 }} />
                    {char.name}
                  </span>
                </div>
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

      {/* Footer */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-faint)',
            letterSpacing: '0.04em',
          }}
        >
          &copy; 2026 マダめもくん
        </span>
      </footer>

      {/* Modals */}
      <CharacterSetupPanel />
      <SettingsPanel />
    </div>
  );
}

