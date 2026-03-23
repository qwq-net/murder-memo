import { useFilteredCharacters } from '@/hooks/useFilteredCharacters';
import { useResponsive } from '@/hooks/useResponsive';
import { useSessionRenaming } from '@/hooks/useSessionRenaming';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';
import { CharacterFilterBar } from '@/components/characters/characterFilterBar';
import { CharacterSetupPanel } from '@/components/characters/characterSetupPanel';
import { ToastContainer } from '@/components/common/toast';
import { WelcomeModal } from '@/components/common/welcomeModal';
import { useSelection } from '@/components/entries/selectionContext';
import { ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown, Search, Settings, User } from '@/components/icons';
import { FreeMemoPanel } from '@/components/panels/freeMemoPanel';
import { SearchOverlay } from '@/components/search/searchOverlay';
import { SettingsPanel } from '@/components/settings/settingsPanel';
import { PersonalMemoPanel } from '@/components/panels/personalMemoPanel';
import { TimelinePanel } from '@/components/panels/timelinePanel';
import { MobileTabNav } from '@/components/layout/mobileTabNav';
import { Panel } from '@/components/layout/panel';
import { PanelContainer } from '@/components/layout/panelContainer';

const PANEL_TITLES: Record<PanelId, string> = {
  free:     'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

/** パネルヘッダーの全開/全閉ボタン */
function GroupCollapseActions({ panelId }: { panelId: PanelId }) {
  const memoGroups = useStore((s) => s.memoGroups);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const uncategorizedCollapsed = useStore((s) => s.uncategorizedCollapsed[panelId] ?? false);
  const setUncategorizedCollapsed = useStore((s) => s.setUncategorizedCollapsed);

  const groups = panelId === 'timeline'
    ? timelineGroups
    : memoGroups.filter((g) => g.panel === panelId);

  if (groups.length === 0) return null;

  // 未分類も含めた全体の折りたたみ状態を判定
  const hasUncategorized = panelId !== 'timeline';
  const allCollapsed = groups.every((g) => g.collapsed) && (!hasUncategorized || uncategorizedCollapsed);
  const allExpanded = groups.every((g) => !g.collapsed) && (!hasUncategorized || !uncategorizedCollapsed);

  const setAll = (collapsed: boolean) => {
    for (const g of groups) {
      if (g.collapsed !== collapsed) {
        if (panelId === 'timeline') {
          updateTimelineGroup(g.id, { collapsed });
        } else {
          updateMemoGroup(g.id, { collapsed });
        }
      }
    }
    // 未分類も連動
    if (hasUncategorized) {
      setUncategorizedCollapsed(panelId, collapsed);
    }
  };

  return (
    <>
      <button
        disabled={allExpanded}
        onClick={() => setAll(false)}
        title="すべて開く"
        aria-label="すべてのグループを開く"
        className="flex items-center bg-transparent border-none text-text-muted p-0.5 cursor-pointer opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:opacity-30 disabled:cursor-default disabled:hover:opacity-30"
      >
        <ChevronsUpDown size={14} />
      </button>
      <button
        disabled={allCollapsed}
        onClick={() => setAll(true)}
        title="すべて閉じる"
        aria-label="すべてのグループを閉じる"
        className="flex items-center bg-transparent border-none text-text-muted p-0.5 cursor-pointer opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:opacity-30 disabled:cursor-default disabled:hover:opacity-30"
      >
        <ChevronsDownUp size={14} />
      </button>
    </>
  );
}

export function AppShell() {
  const order = useStore((s) => s.layout.order);
  const activePanel = useStore((s) => s.activePanel);
  const setCharacterSetupOpen = useStore((s) => s.setCharacterSetupOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const addToast = useStore((s) => s.addToast);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const switchSession = useStore((s) => s.switchSession);
  const createSession = useStore((s) => s.createSession);
  const renameSession = useStore((s) => s.renameSession);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const { hasSelection, clearSelection } = useSelection();

  const isDemo = sessions.find((s) => s.id === activeSessionId)?.isDemo ?? false;

  const { isMobile } = useResponsive(1024);
  const { plChars, npcChars } = useFilteredCharacters();
  const sessionRename = useSessionRenaming({ sessions, activeSessionId, renameSession });

  const PANEL_CONTENT: Record<PanelId, React.ReactNode> = {
    free:     <FreeMemoPanel />,
    personal: <PersonalMemoPanel />,
    timeline: <TimelinePanel />,
  };

  const orderedPanels = order.map((id) => ({
    id,
    node: (
      <Panel
        panelId={id}
        title={PANEL_TITLES[id]}
        actions={
          <>
            <CharacterFilterBar panelId={id} />
            <GroupCollapseActions panelId={id} />
          </>
        }
      >
        {PANEL_CONTENT[id]}
      </Panel>
    ),
  }));

  return (
    <div
      onClick={() => { if (hasSelection) clearSelection(); }}
      className="flex flex-col h-full bg-bg-base"
    >
      {/* ── Global Header ── */}
      <header className="flex flex-col bg-bg-surface border-b border-border-subtle z-20 shrink-0">
        {/* ── Row 1: Logo + 登場人物設定 ── */}
        <div
          className="flex items-center justify-between px-[14px]"
          style={{ height: 'var(--header-h)' }}
        >
          {/* Logo / title */}
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="マダめもくん" width="20" height="20" />
            <span className="text-sm text-text-primary tracking-[0.08em] font-semibold">
              マダめもくん
            </span>
          </div>

          {/* 右側ボタン群 */}
          <div className="flex items-center gap-2">
          {/* 検索ボタン */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid var(--header-btn-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--header-btn-border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--header-btn-border)';
            }}
          >
            <Search size={13} />
            {!isMobile && '検索'}
          </button>

          <button
            onClick={() => setCharacterSetupOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: '1px solid var(--header-btn-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--header-btn-border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--header-btn-border)';
            }}
          >
            <User size={13} />
            登場人物設定
          </button>

          {/* アプリ設定ボタン */}
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: '1px solid color-mix(in srgb, var(--color-settings-accent) 40%, transparent)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-settings-accent)',
              fontSize: 14,
              padding: '4px 10px', // btn-sm と同サイズ
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#d9683a';
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-settings-accent) 70%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-settings-accent)';
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-settings-accent) 40%, transparent)';
            }}
          >
            <Settings size={13} />
            アプリ設定
          </button>
          </div>
        </div>

        {/* ── Row 2: Session (left) + Action order strip (right) ── */}
        <div className="flex items-center justify-between px-[14px] pb-2 gap-3 min-h-[28px]">
          {/* Session switcher */}
          <div className="flex items-center gap-2 min-w-0">
            {sessionRename.isRenaming ? (
              <input
                autoFocus
                value={sessionRename.renameValue}
                onChange={(e) => sessionRename.setRenameValue(e.target.value)}
                onBlur={sessionRename.handleBlur}
                onKeyDown={sessionRename.handleKeyDown}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--color-settings-accent)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
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
                aria-label="セッション切替"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
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
              onClick={() => sessionRename.startRenaming()}
              title="セッション名を変更"
              className="btn-ghost"
              style={{ width: 26, height: 26, justifyContent: 'center', padding: 0, flexShrink: 0 }}
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
                addToast('セッションを作成しました');
              }}
              title="新しいセッション"
              className="btn-ghost"
              style={{ width: 26, height: 26, justifyContent: 'center', padding: 0, flexShrink: 0, fontSize: 14, lineHeight: 1 }}
            >
              +
            </button>
            {isDemo && (
              <span
                className="flex items-center gap-0.5 text-xs whitespace-nowrap animate-pulse"
                style={{ color: 'var(--accent)' }}
              >
                <ChevronLeft size={14} />
                こちらから新しいセッションを作成！
              </span>
            )}
          </div>

          {/* 行動順ステッパー — PL | NPC */}
          {(plChars.length > 0 || npcChars.length > 0) && (
            <div className="flex items-center overflow-hidden gap-2">
              {/* PL */}
              {plChars.map((char, i) => (
                <div key={char.id} className="flex items-center shrink-0">
                  {i > 0 && (
                    <ChevronRight size={14} className="shrink-0 mx-0.5 text-text-faint" />
                  )}
                  <span className="flex items-center gap-1 text-sm text-text-secondary whitespace-nowrap">
                    <span className="inline-block size-2.5 rounded-full shrink-0" style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }} />
                    {char.name}
                  </span>
                </div>
              ))}

              {/* セパレータ */}
              {plChars.length > 0 && npcChars.length > 0 && (
                <span className="text-text-faint text-sm mx-1 shrink-0">|</span>
              )}

              {/* NPC */}
              {npcChars.map((char, i) => (
                <div key={char.id} className="flex items-center shrink-0">
                  {i > 0 && (
                    <ChevronRight size={14} className="shrink-0 mx-0.5 text-text-faint" />
                  )}
                  <span className="flex items-center gap-1 text-sm text-text-muted whitespace-nowrap">
                    <span className="inline-block size-2.5 rounded-full shrink-0 opacity-70" style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }} />
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
          <div className="flex-1 overflow-hidden">
            {orderedPanels.find((p) => p.id === activePanel)?.node}
          </div>
          <MobileTabNav />
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PanelContainer panels={orderedPanels} />
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-center px-[14px] py-1.5 border-t border-border-subtle bg-bg-surface shrink-0">
        <span className="text-sm text-text-faint tracking-[0.04em]">
          &copy; 2026 マダめもくん
        </span>
      </footer>

      {/* Toast */}
      <ToastContainer />

      {/* Modals */}
      <WelcomeModal />
      <CharacterSetupPanel />
      <SettingsPanel />
      <SearchOverlay />
    </div>
  );
}

