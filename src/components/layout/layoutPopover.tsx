import { Columns2 } from '@/components/icons';
import { HeaderButton } from '@/components/layout/headerButton';
import { LayoutEditor } from '@/components/settings/layoutEditor';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useResponsive } from '@/hooks/useResponsive';
import { useT } from '@/i18n';
import { arrangementEqual } from '@/lib/panelLayout';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';

/**
 * ヘッダーの「レイアウト」ボタンと、その直下に開くセッション単位の編集ポップオーバー。
 *
 * グローバル設定（アプリ設定モーダル）が「新規セッションの初期値」を編集するのに対し、
 * こちらは現在のセッションにのみ効く即時編集用。LayoutEditor を共有し、変更は解決済み
 * レイアウト（layoutDraft → session.layout → settings.layout の優先順）を起点に
 * updateSessionLayout でセッション層へ書き込む（copy-on-write）。
 *
 * 閉じる手段は ①透明オーバーレイのクリック ②ESC キー の2系統。
 */
export function LayoutMenuButton() {
  const t = useT();
  const isOpen = useStore((s) => s.isLayoutPopoverOpen);
  const setOpen = useStore((s) => s.setLayoutPopoverOpen);
  const resolved = useStore(selectResolvedLayout);
  const updateSessionLayout = useStore((s) => s.updateSessionLayout);
  const clearSessionLayout = useStore((s) => s.clearSessionLayout);
  const flashLayoutOrderHint = useStore((s) => s.flashLayoutOrderHint);
  const globalLayout = useStore((s) => s.settings.layout);
  // アクティブセッションが固有レイアウトを持つ＝グローバル準拠から独立している
  const hasSessionLayout = useStore(
    (s) => !!s.sessions.find((x) => x.id === s.activeSessionId)?.layout,
  );
  const { isMobile } = useResponsive(1024);

  // 配置（構造・並び順・表示）が実際に変わったときだけ順番ヒント（①②③）を発火する。
  // サイズだけの変更や同値変更では出さない（デスクトップのパネル領域に出るためモバイルでは無意味だが、
  // 発火しても表示先が無いだけで害はない）
  const applyWithHint = (next: Parameters<typeof updateSessionLayout>[0]) => {
    const changed = !arrangementEqual(resolved, next);
    void updateSessionLayout(next);
    if (changed) flashLayoutOrderHint();
  };

  // open 時のみ ESC で閉じる
  useEscapeKey(() => setOpen(false), isOpen);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <HeaderButton onClick={() => setOpen(!isOpen)} title={t('layout.layoutBtnTitle')}>
        <Columns2 size={13} />
        {!isMobile && t('layout.layoutBtn')}
      </HeaderButton>

      {isOpen && (
        <>
          {/* クリックで閉じる透明オーバーレイ */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 29 }}
            aria-hidden="true"
          />

          {/* アンカー式ポップオーバーカード */}
          <div
            role="dialog"
            aria-label={t('layout.popover.dialogLabel')}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 30,
              width: 300,
              padding: '14px 16px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 32px var(--shadow-menu)',
            }}
          >
            {/* 見出し + 注記 */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.04em',
                }}
              >
                {t('layout.popover.heading')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {t('layout.popover.note')}
              </div>
            </div>

            <LayoutEditor layout={resolved} onChange={applyWithHint} showStructure={!isMobile} />

            {/* グローバル設定へ戻す（セッション固有レイアウトを持つときのみ） */}
            {hasSessionLayout && (
              <button
                type="button"
                onClick={() => {
                  // グローバル準拠へ戻すと解決済みレイアウトが settings.layout に切り替わる。
                  // 配置が変わる場合は順番ヒントで結果を示す
                  const changed = !arrangementEqual(resolved, globalLayout);
                  void clearSessionLayout();
                  if (changed) flashLayoutOrderHint();
                }}
                style={{
                  marginTop: 14,
                  background: 'none',
                  border: 'none',
                  padding: '2px 0',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'color 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {t('layout.popover.resetToGlobal')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
