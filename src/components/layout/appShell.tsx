import { useMemo } from 'react';

import { CharacterFilterBar } from '@/components/characters/characterFilterBar';
import { CharacterSetupPanel } from '@/components/characters/characterSetupPanel';
import { ToastContainer } from '@/components/common/toast';
import { WelcomeModal } from '@/components/common/welcomeModal';
import { DeductionModal } from '@/components/deductions/deductionModal';
import { EntriesDndContext } from '@/components/entries/dnd/entriesDndContext';
import { ImportanceFilterBar } from '@/components/entries/importanceFilterBar';
import { useSelection } from '@/components/entries/selectionContext';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleHelp,
  Link2,
  Search,
  Settings,
  User,
} from '@/components/icons';
import { HeaderButton } from '@/components/layout/headerButton';
import { LayoutMenuButton } from '@/components/layout/layoutPopover';
import { MobileTabNav } from '@/components/layout/mobileTabNav';
import { Panel } from '@/components/layout/panel';
import { PanelContainer } from '@/components/layout/panelContainer';
import { LinkListModal } from '@/components/links/linkListModal';
import { FreeMemoPanel } from '@/components/panels/freeMemoPanel';
import { PersonalMemoPanel } from '@/components/panels/personalMemoPanel';
import { TimelinePanel } from '@/components/panels/timelinePanel';
import { RelationDiagramModal } from '@/components/relations/relationDiagramModal';
import { SearchOverlay } from '@/components/search/searchOverlay';
import { SettingsPanel } from '@/components/settings/settingsPanel';
import { useFilteredCharacters } from '@/hooks/useFilteredCharacters';
import { useResponsive } from '@/hooks/useResponsive';
import { useSessionRenaming } from '@/hooks/useSessionRenaming';
import { useT } from '@/i18n';
import { visiblePanels } from '@/lib/panelLayout';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';
import type { PanelId } from '@/types/memo';

/** パネルヘッダーの全開/全閉ボタン */
function GroupCollapseActions({ panelId }: { panelId: PanelId }) {
  const t = useT();
  const memoGroups = useStore((s) => s.memoGroups);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const updateTimelineGroup = useStore((s) => s.updateTimelineGroup);
  const uncategorizedCollapsed = useStore((s) => s.uncategorizedCollapsed[panelId] ?? false);
  const setUncategorizedCollapsed = useStore((s) => s.setUncategorizedCollapsed);
  // 未分類セクションは「そのパネルに未分類エントリが存在する」ときだけ表示される。
  // 存在しないのに折りたたみ状態を全開/全閉判定に含めると、ボタンの活性が実態とずれるため、
  // 実際に未分類エントリがあるかで判定する（タイムラインは未分類概念が無いので常に false）。
  const hasUncategorized = useStore((s) =>
    panelId === 'timeline' ? false : s.entries.some((e) => e.panel === panelId && !e.groupId),
  );

  const groups =
    panelId === 'timeline' ? timelineGroups : memoGroups.filter((g) => g.panel === panelId);

  if (groups.length === 0) return null;

  // 未分類も含めた全体の折りたたみ状態を判定
  const allCollapsed =
    groups.every((g) => g.collapsed) && (!hasUncategorized || uncategorizedCollapsed);
  const allExpanded =
    groups.every((g) => !g.collapsed) && (!hasUncategorized || !uncategorizedCollapsed);

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
        title={t('layout.expandAll')}
        aria-label={t('layout.expandAllAria')}
        className="text-text-muted flex cursor-pointer items-center border-none bg-transparent p-0.5 opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:cursor-default disabled:opacity-30 disabled:hover:opacity-30"
      >
        <ChevronsUpDown size={14} />
      </button>
      <button
        disabled={allCollapsed}
        onClick={() => setAll(true)}
        title={t('layout.collapseAll')}
        aria-label={t('layout.collapseAllAria')}
        className="text-text-muted flex cursor-pointer items-center border-none bg-transparent p-0.5 opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:cursor-default disabled:opacity-30 disabled:hover:opacity-30"
      >
        <ChevronsDownUp size={14} />
      </button>
    </>
  );
}

export function AppShell() {
  const t = useT();
  const layout = useStore(selectResolvedLayout);
  const activePanel = useStore((s) => s.activePanel);
  const isSessionReady = useStore((s) => s.isSessionReady);
  const setCharacterSetupOpen = useStore((s) => s.setCharacterSetupOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const addToast = useStore((s) => s.addToast);
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const switchSession = useStore((s) => s.switchSession);
  const createSession = useStore((s) => s.createSession);
  const renameSession = useStore((s) => s.renameSession);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const setDeductionOpen = useStore((s) => s.setDeductionOpen);
  const setRelationDiagramOpen = useStore((s) => s.setRelationDiagramOpen);
  const setLinkListOpen = useStore((s) => s.setLinkListOpen);
  const { hasSelection, clearSelection } = useSelection();

  const isDemo = sessions.find((s) => s.id === activeSessionId)?.isDemo ?? false;

  const { isMobile } = useResponsive(1024);
  const { plChars, npcChars } = useFilteredCharacters();
  const sessionRename = useSessionRenaming({ sessions, activeSessionId, renameSession });

  // 表示パネルの導出はセレクタではなく useMemo で行う規約
  // （セレクタが毎回新配列を返すと全購読者が再レンダーするため）
  const visible = useMemo(() => visiblePanels(layout), [layout]);

  // セッション初期化／切替完了まではローディング表示。
  // 初回起動時は IDB マイグレーションやサンプルシナリオ再投入を待ち、
  // セッション切替時もデータロード完了まで操作不能にする（中途半端なデータでの編集を防ぐ）。
  if (!isSessionReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-bg-base flex h-full flex-col items-center justify-center gap-3"
      >
        <img src="/logo.svg" alt={t('app.title')} width="32" height="32" className="opacity-60" />
        <div
          className="size-5 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--border-default)',
            borderTopColor: 'var(--accent)',
          }}
          aria-hidden="true"
        />
        <span className="text-text-muted text-xs">{t('layout.loading')}</span>
      </div>
    );
  }

  const PANEL_CONTENT: Record<PanelId, React.ReactNode> = {
    free: <FreeMemoPanel />,
    personal: <PersonalMemoPanel />,
    timeline: <TimelinePanel />,
  };

  // 表示パネルのみ描画ノードを生成する（非表示パネルはマウント自体しない）
  const panelNodes: Partial<Record<PanelId, React.ReactNode>> = {};
  for (const id of visible) {
    panelNodes[id] = (
      <Panel
        panelId={id}
        title={t(`panels.${id}` as Parameters<typeof t>[0])}
        actions={
          <>
            <CharacterFilterBar panelId={id} />
            <ImportanceFilterBar panelId={id} />
            <GroupCollapseActions panelId={id} />
          </>
        }
      >
        {PANEL_CONTENT[id]}
      </Panel>
    );
  }

  return (
    <div
      onClick={() => {
        if (hasSelection) clearSelection();
      }}
      className="bg-bg-base flex h-full flex-col"
    >
      {/* ── Global Header ── */}
      <header className="bg-bg-surface border-border-subtle z-20 flex shrink-0 flex-col border-b">
        {/* ── Row 1: Logo + 登場人物設定 ── */}
        <div
          className="flex items-center justify-between px-[14px]"
          style={{ height: 'var(--header-h)' }}
        >
          {/* Logo / title + 使い方ガイドへの導線 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt={t('app.title')} width="20" height="20" />
              <span className="text-text-primary text-sm font-semibold tracking-[0.08em]">
                {t('app.title')}
              </span>
            </div>
            <HeaderButton
              href="/guide"
              target="_blank"
              rel="noopener noreferrer"
              title={t('layout.guideTitle')}
            >
              <CircleHelp size={13} />
              {!isMobile && t('layout.guide')}
            </HeaderButton>
          </div>

          {/* 右側ボタン群 */}
          <div className="flex items-center gap-2">
            {/* 検索ボタン */}
            <HeaderButton onClick={() => setSearchOpen(true)}>
              <Search size={13} />
              {!isMobile && t('layout.search')}
            </HeaderButton>

            {/* リンク一覧 — 検索の隣に配置（関連機能としてグルーピング） */}
            <HeaderButton onClick={() => setLinkListOpen(true)}>
              <Link2 size={13} />
              {!isMobile && t('layout.linkList')}
            </HeaderButton>

            <HeaderButton onClick={() => setDeductionOpen(true)} title={t('layout.deductionsAria')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.5 4.3 12.3l.7-4.1-3-2.9 4.2-.7L8 1z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              {!isMobile && t('layout.deductions')}
            </HeaderButton>

            <HeaderButton onClick={() => setRelationDiagramOpen(true)} title={t('layout.relationsAria')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <line
                  x1="6"
                  y1="5"
                  x2="10"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <line
                  x1="5"
                  y1="6"
                  x2="7"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <line
                  x1="11"
                  y1="6"
                  x2="9"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </svg>
              {!isMobile && t('layout.relations')}
            </HeaderButton>

            <HeaderButton onClick={() => setCharacterSetupOpen(true)} title={t('layout.charactersAria')}>
              <User size={13} />
              {t('layout.characters')}
            </HeaderButton>

            {/* レイアウト編集（セッション単位）— 設定ボタンの直前に配置 */}
            <LayoutMenuButton />

            {/* アプリ設定ボタン */}
            <HeaderButton onClick={() => setSettingsOpen(true)} variant="settings">
              <Settings size={13} />
              {t('layout.settingsBtn')}
            </HeaderButton>
          </div>
        </div>

        {/* ── Row 2: Session (left) + Action order strip (right) ── */}
        <div className="flex min-h-[28px] items-center justify-between gap-3 px-[14px] pb-2">
          {/* Session switcher */}
          <div className="flex min-w-0 items-center gap-2">
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
                aria-label={t('layout.sessionSwitch')}
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {/* Rename */}
            <button
              onClick={() => sessionRename.startRenaming()}
              title={t('layout.renameSession')}
              className="btn-ghost"
              style={{ width: 26, height: 26, justifyContent: 'center', padding: 0, flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 1.5a2.121 2.121 0 0 1 3 3L5 14l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* New session */}
            <button
              onClick={async () => {
                const today = new Date();
                const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                const prefix = t('layout.sessionNamePrefix');
                const baseName = `${prefix}${dateStr}`;
                // 同じ日付のセッションが既にあれば -2, -3 … と連番を付与
                const sameDate = sessions.filter(
                  (s) =>
                    s.name === baseName ||
                    s.name.match(new RegExp(`^${prefix}${dateStr}-(\\d+)$`)),
                );
                const name =
                  sameDate.length === 0 ? baseName : `${baseName}-${sameDate.length + 1}`;
                // 作成は activeSessionId 切替で subscribe が pause→load→resume する。
                // ただし作成自体（putSession）が失敗すると subscribe が走らず resume されないため、
                // 失敗時はここで resume し、成功を確認してからトーストを出す（虚偽の成功通知を防ぐ）。
                useStore.temporal.getState().pause();
                try {
                  await createSession(name);
                  addToast(t('layout.sessionCreated'));
                } catch (err) {
                  useStore.temporal.getState().resume();
                  addToast(t('layout.sessionCreateFailed'), 'error');
                  console.error('セッション作成に失敗しました', err);
                }
              }}
              title={t('layout.newSession')}
              className="btn-ghost"
              style={{
                width: 26,
                height: 26,
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              +
            </button>
            {isDemo && (
              <span
                className="flex animate-pulse items-center gap-0.5 text-xs whitespace-nowrap"
                style={{ color: 'var(--accent)' }}
              >
                <ChevronLeft size={14} />
                {t('layout.demoBanner')}
              </span>
            )}
          </div>

          {/* 行動順ステッパー — プレイヤー | NPC */}
          {(plChars.length > 0 || npcChars.length > 0) && (
            <div className="flex items-center gap-2 overflow-hidden">
              {/* プレイヤー */}
              {plChars.map((char, i) => (
                <div key={char.id} className="flex shrink-0 items-center">
                  {i > 0 && <ChevronRight size={14} className="text-text-faint mx-0.5 shrink-0" />}
                  <span className="text-text-secondary flex items-center gap-1 text-sm whitespace-nowrap">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }}
                    />
                    {char.name}
                  </span>
                </div>
              ))}

              {/* セパレータ */}
              {plChars.length > 0 && npcChars.length > 0 && (
                <span className="text-text-faint mx-1 shrink-0 text-sm">|</span>
              )}

              {/* NPC */}
              {npcChars.map((char, i) => (
                <div key={char.id} className="flex shrink-0 items-center">
                  {i > 0 && <ChevronRight size={14} className="text-text-faint mx-0.5 shrink-0" />}
                  <span className="text-text-muted flex items-center gap-1 text-sm whitespace-nowrap">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full opacity-70"
                      style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }}
                    />
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
          {/* activePanel が非表示パネルを指さないことは store/index.ts のガードが保証する */}
          <div className="flex-1 overflow-hidden">{panelNodes[activePanel]}</div>
          <MobileTabNav />
        </>
      ) : (
        // デスクトップは全パネルを 1 つの DnD コンテキストで包み、カラム（パネル）間の
        // エントリ移動も成立させる。モバイル（単一パネル表示）は各パネルが自前で
        // コンテキストを張るため、ここでは包まない。
        <EntriesDndContext>
          <div className="min-h-0 flex-1 overflow-hidden">
            <PanelContainer panels={panelNodes} />
          </div>
        </EntriesDndContext>
      )}

      {/* Footer */}
      <footer className="border-border-subtle bg-bg-surface flex shrink-0 items-center justify-center border-t px-[14px] py-1.5">
        <span className="text-text-faint text-sm tracking-[0.04em]">{t('layout.footer')}</span>
      </footer>

      {/* Toast */}
      <ToastContainer />

      {/* Modals */}
      <WelcomeModal />
      <CharacterSetupPanel />
      <DeductionModal />
      <RelationDiagramModal />
      <LinkListModal />
      <SettingsPanel />
      <SearchOverlay />
    </div>
  );
}
