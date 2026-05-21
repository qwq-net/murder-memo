import type { ReactNode } from 'react';

import { IconImportance } from '@/components/icons';
import type { MemoEntry, PanelId } from '@/types/memo';

const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

const IMPORTANCE_COLOR: Record<NonNullable<MemoEntry['importance']>, string> = {
  high: 'var(--importance-high)',
  medium: 'var(--importance-medium)',
  low: 'var(--importance-low)',
};

interface EntryCardViewProps {
  /** 表示するエントリ */
  entry: MemoEntry;
  /** タイムラインで時刻列を隠す（同時刻グループ内） */
  hideTime?: boolean;
  /** カード単位のホバー状態（背景 / 縦線濃度 / バッジ展開等に流す） */
  hovered?: boolean;
  /** 選択状態（左縦線がアクセント色に変わる） */
  selected?: boolean;
  /** マウスホバーで装飾を変える際に呼ぶハンドラ。Guide では state を内蔵で良いが、本体は外注 */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /**
   * 中身（コンテンツ）。
   * 通常は `TimelineEntryView` / `TextEntryView` / `ImageEntryView` を呼び出し側で組み立てる。
   * これにより本体（store 連携）でも Guide（純粋データ）でも同じカード枠を使い回せる。
   */
  children: ReactNode;
}

/**
 * `EntryCard` のレイアウト・装飾部分を切り出した純粋表示版。
 *
 * - 重要度グラデーション / 左縦線 / タイムラインマーカー / 重要度アイコン を担当
 * - useStore / useSelection / コンテキストメニュー / hover state は持たない（呼び出し側で）
 * - 本体（store 連携）と Guide（ハードコード）の両方から呼び出して、同じ見た目で表示する
 */
export function EntryCardView({
  entry,
  hideTime,
  hovered = false,
  selected = false,
  onMouseEnter,
  onMouseLeave,
  children,
}: EntryCardViewProps) {
  const accent = PANEL_ACCENT[entry.panel] ?? 'var(--border-default)';
  const importanceColor = entry.importance ? IMPORTANCE_COLOR[entry.importance] : null;

  return (
    <div
      data-entry-id={entry.id}
      className="relative my-[4px] flex flex-col rounded-sm p-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: hovered
          ? 'color-mix(in srgb, var(--bg-hover) 50%, transparent)'
          : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* 重要度グラデーション — 右から左へ薄くフェード */}
      {importanceColor && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `linear-gradient(to left, ${importanceColor}, transparent 60%)`,
            opacity: hovered ? 0.1 : 0.06,
            transition: 'opacity 0.12s',
          }}
        />
      )}

      {/* 左縦線 — パネルアイデンティティ専用。選択時はアクセント強調 */}
      <div
        className="pointer-events-none absolute rounded-sm"
        style={{
          left: entry.type === 'timeline' ? 'var(--tl-content-left)' : 4,
          top: -1,
          bottom: -1,
          width: selected ? 4 : 3,
          background: selected ? 'var(--accent)' : accent,
          opacity: selected ? 0.9 : hovered ? 0.6 : 0.45,
          transition: 'opacity 0.12s, width 0.12s, background 0.12s',
        }}
      />

      {/* タイムラインマーカー — ドット + 水平ティック (SVG) */}
      {entry.type === 'timeline' && !!entry.eventTime && !hideTime && (
        <svg
          className="pointer-events-none absolute"
          width="14"
          height="5"
          viewBox="0 0 14 5"
          style={{
            left: 'calc(var(--tl-spine-x) - 8.6px)',
            top: 10,
            transition: 'opacity 0.12s',
          }}
        >
          <circle
            cx="2.5"
            cy="2.5"
            r="2.5"
            fill={selected ? 'var(--accent)' : 'var(--panel-timeline-accent)'}
            opacity={selected ? 1 : hovered ? 0.8 : 0.45}
          />
          <line
            x1="5"
            y1="2.5"
            x2="14"
            y2="2.5"
            stroke={selected ? 'var(--accent)' : 'var(--panel-timeline-accent)'}
            strokeWidth="1"
            opacity={selected ? 0.8 : hovered ? 0.5 : 0.2}
          />
        </svg>
      )}

      {/* コンテンツ + 右端インジケータ列 */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* コンテンツ */}
        <div className="min-w-0" style={{ flex: 1 }}>
          {children}
        </div>

        {/* 右端インジケータ列 — 重要度アイコン */}
        {importanceColor && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              flexShrink: 0,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <IconImportance
              size={12}
              color={importanceColor}
              className="pointer-events-none"
              style={{
                opacity: hovered ? 0.9 : 0.6,
                transition: 'opacity 0.12s',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
