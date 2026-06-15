import { ColorDot } from '@/components/common/colorDot';
import { PANEL_CARD_ACCENT } from '@/components/settings/panelConstants';
import { PanelOrderEditor } from '@/components/settings/panelOrderEditor';
import { useT } from '@/i18n';
import {
  applySequence,
  applyStructure,
  classifyStructure,
  setPanelHidden,
  structuresForCount,
  visiblePanels,
} from '@/lib/panelLayout';
import type { LayoutStructure, PanelId, PanelLayout } from '@/types/memo';

/* ── 共通定数 ─────────────────────────────────────────────────────────────── */

/** 全パネル（行表示で「非表示」も含めて並べるための固定順） */
const ALL_PANELS: readonly PanelId[] = ['free', 'timeline', 'personal'];

/* ── スキーマ図 ───────────────────────────────────────────────────────────── */

/** 図の1ペイン（小矩形）の共通スタイル */
const PANE_STYLE: React.CSSProperties = {
  flex: 1,
  borderRadius: 2,
  background: 'var(--text-faint)',
};

/** 縦に積んだ2ペイン（stack 系カラムの中身） */
function StackedPanes() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={PANE_STYLE} />
      <div style={PANE_STYLE} />
    </div>
  );
}

/**
 * 構造プリセットを小さな矩形群で図示する（カラム=横並びの div、縦積み=列内で縦並び）。
 * count は「横並び」時の列数を決めるために使う（stack 系は形状が固定なので影響しない）。
 */
function StructureSchema({ structure, count }: { structure: LayoutStructure; count: number }) {
  let body: React.ReactNode;
  if (structure === 'stacked') {
    body = <StackedPanes />;
  } else if (structure === 'stack-left') {
    body = (
      <>
        <StackedPanes />
        <div style={PANE_STYLE} />
      </>
    );
  } else if (structure === 'stack-right') {
    body = (
      <>
        <div style={PANE_STYLE} />
        <StackedPanes />
      </>
    );
  } else {
    // columns: 表示枚数ぶんの縦矩形を横並び
    body = Array.from({ length: Math.max(1, count) }, (_, i) => <div key={i} style={PANE_STYLE} />);
  }

  return (
    <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'flex', gap: 2 }}>
      {body}
    </div>
  );
}

/* ── レイアウトエディタ本体 ───────────────────────────────────────────────── */

/** 各ブロックの小見出し */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
      {children}
    </span>
  );
}

/**
 * グローバル設定 / セッション単位ポップオーバーで共有するレイアウト編集 UI。
 *
 * 3ブロック構成:
 * 1. 構造選択（showStructure 時のみ・表示2枚以上のとき）— スキーマ図トグル
 * 2. パネルの表示/非表示
 * 3. 並び順（表示2枚以上のとき）— 既存 PanelOrderEditor
 *
 * 状態は持たず、すべての変更は純関数（applyStructure / setPanelHidden / applySequence）を
 * 通して onChange へ委ねる（呼び手が永続レイヤーへ反映する）。
 */
export function LayoutEditor({
  layout,
  onChange,
  showStructure = true,
}: {
  layout: PanelLayout;
  onChange: (next: PanelLayout) => void;
  showStructure?: boolean;
}) {
  const t = useT();
  const visible = visiblePanels(layout);
  const visibleSet = new Set(visible);
  const structures = structuresForCount(visible.length);
  const currentStructure = classifyStructure(layout);
  // 表示順 → 非表示（薄く）の順で全パネルを行表示する
  const orderedPanels: PanelId[] = [...visible, ...ALL_PANELS.filter((p) => !visibleSet.has(p))];

  /** 構造プリセットのラベルを表示枚数込みで解決する（t に依存するためレンダー内で生成） */
  function structureLabel(structure: LayoutStructure, count: number): string {
    if (structure === 'columns') {
      return count <= 1
        ? t('settings.structureColumns1')
        : count === 2
          ? t('settings.structureColumns2')
          : t('settings.structureColumns3');
    }
    const map: Record<Exclude<LayoutStructure, 'columns'>, string> = {
      'stack-left': t('settings.structureStackLeft'),
      'stack-right': t('settings.structureStackRight'),
      stacked: t('settings.structureStacked'),
    };
    return map[structure];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── 1. 構造選択 ── */}
      {showStructure && structures.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <BlockLabel>{t('settings.layoutStructure')}</BlockLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {structures.map((s) => {
              const selected = s === currentStructure;
              const label = structureLabel(s, visible.length);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange(applyStructure(layout, s))}
                  title={label}
                  aria-label={label}
                  aria-pressed={selected}
                  style={{
                    width: 48,
                    height: 36,
                    padding: 5,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-base)',
                    border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-default)'}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}
                >
                  <StructureSchema structure={s} count={visible.length} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. パネルの表示 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BlockLabel>{t('settings.layoutPanelVisibility')}</BlockLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orderedPanels.map((panelId) => {
            const isVisible = visibleSet.has(panelId);
            // 表示が残り1枚のとき、その1枚を隠す操作は禁止（全非表示防止）
            const isLastVisible = isVisible && visible.length <= 1;
            return (
              <label
                key={panelId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-elevated)',
                  cursor: isLastVisible ? 'default' : 'pointer',
                  opacity: isVisible ? 1 : 0.5,
                }}
              >
                {/* アクセントドット */}
                <ColorDot color={PANEL_CARD_ACCENT[panelId]} />
                {/* パネル名 */}
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>
                  {t(`panels.${panelId}` as Parameters<typeof t>[0])}
                </span>
                {/* 表示/非表示トグル */}
                <input
                  type="checkbox"
                  checked={isVisible}
                  disabled={isLastVisible}
                  onChange={() => onChange(setPanelHidden(layout, panelId, isVisible))}
                  title={
                    isLastVisible
                      ? t('settings.panelLastVisibleTooltip')
                      : isVisible
                        ? t('settings.panelHideTooltip')
                        : t('settings.panelShowTooltip')
                  }
                  aria-label={`${t(`panels.${panelId}` as Parameters<typeof t>[0])}${isVisible ? t('settings.panelHideTooltip') : t('settings.panelShowTooltip')}`}
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: 'var(--accent)',
                    cursor: isLastVisible ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 3. 並び順 ── */}
      {visible.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <BlockLabel>{t('settings.layoutPanelOrder')}</BlockLabel>
          <PanelOrderEditor
            order={visible}
            onChange={(seq) => onChange(applySequence(layout, seq))}
          />
        </div>
      )}
    </div>
  );
}
