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
  ChevronsDownUp,
  ChevronsUpDown,
  CircleHelp,
  Columns2,
  Link2,
  Plus,
  Search,
  Settings,
  SquarePen,
  Trash2,
  User,
  X,
} from 'lucide-react';

// ─── アプリ固有アイコン（手書き SVG） ────────────────────────────────────────

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** 重要度マーカー（!マーク入り丸） — EntryCard */
export function IconImportance({
  size = 14,
  color,
  className,
  style,
}: IconProps & { color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={style}
    >
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="7" x2="8" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="4.5" r="1" fill={color} />
    </svg>
  );
}
