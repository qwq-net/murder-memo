/**
 * 共通SVGアイコンコンポーネント。
 * 各コンポーネントにインラインで散らばっていたSVGを集約。
 * Props: size（デフォルト12）, className（Tailwindクラス適用可）
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** 人物シルエット — 登場人物設定ボタン */
export function IconPerson({ size = 13, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={style}>
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 歯車/太陽 — アプリ設定ボタン */
export function IconSettings({ size = 13, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} style={style}>
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.76 2.76l1.06 1.06M10.18 10.18l1.06 1.06M2.76 11.24l1.06-1.06M10.18 3.82l1.06-1.06" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 鉛筆 — 編集ボタン */
export function IconEdit({ size = 12, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <path d="M11.5 1.5a2.121 2.121 0 0 1 3 3L5 14l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 鉛筆（角ばった版） — グループ名編集 */
export function IconEditSquare({ size = 11, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 右向き矢印 — サブメニュー、行動順セパレータ */
export function IconChevronRight({ size = 8, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="none" className={className} style={style}>
      <path d="M2 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 下向き矢印 — 折りたたみ、ドロップダウン */
export function IconChevronDown({ size = 12, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className} style={style}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 上向き矢印 — パネル順序の上移動 */
export function IconChevronUp({ size = 12, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className} style={style}>
      <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** × 閉じる（大きめ 18px版） — モーダル閉じる */
export function IconCloseLg({ size = 18, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className} style={style}>
      <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** × 閉じる（小さめ 12px版） — グループ削除、エントリ削除 */
export function IconClose({ size = 12, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className} style={style}>
      <line x1="3" y1="3" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** + プラス — 追加ボタン */
export function IconPlus({ size = 12, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** + プラス（小さめ） — EntryInput内のグループ追加 */
export function IconPlusSm({ size = 8, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" className={className} style={style}>
      <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** メモ帳 — EmptyState */
export function IconMemo({ size = 28, className, style }: IconProps & { accentColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className} style={{ opacity: 0.4, ...style }}>
      <rect x="4" y="2" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="9" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="9" y1="20" x2="14" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** 重要度マーカー（!マーク入り丸） — EntryCard */
export function IconImportance({ size = 14, color, className, style }: IconProps & { color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="7" x2="8" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="4.5" r="1" fill={color} />
    </svg>
  );
}

/** 行動順のシェブロン（大きめ） — AppShellの行動順表示 */
export function IconChevronRightLg({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} style={style}>
      <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
