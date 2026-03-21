/**
 * アイコン集約モジュール。
 * 汎用アイコンは lucide-react を re-export し、
 * アプリ固有のアイコンのみ手書き SVG で定義する。
 */

// ─── lucide-react re-export ─────────────────────────────────────────────────

export {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Plus,
  Settings,
  SquarePen,
  User,
  X,
} from 'lucide-react';

// ─── アプリ固有アイコン（手書き SVG） ────────────────────────────────────────

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
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
