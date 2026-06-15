import { ColorDot } from '@/components/common/colorDot';
import { X } from '@/components/icons';
import type { CharacterRelation } from '@/types/memo';

interface RelationListItemViewProps {
  /** 表示する関係 */
  relation: CharacterRelation;
  /** from 側のキャラ名（解決済み。見つからない場合は '？' などを呼び出し側で渡す） */
  fromName: string;
  /** from 側のキャラ色 */
  fromColor: string;
  /** to 側のキャラ名 */
  toName: string;
  /** to 側のキャラ色 */
  toColor: string;
  /** 削除ハンドラ。Guide では noop で渡せる */
  onRemove?: (relationId: string) => void;
  /** 削除ボタンの title 属性（i18n 済みのテキストを呼び出し側から渡す） */
  removeTitle?: string;
}

/**
 * 相関図のリスト 1 行（from + ラベル + to + 削除）の純粋表示版。
 *
 * - `useStore` には触れず、props で全データを受ける
 * - キャラ名・色の解決は呼び出し側の責務（charMap などから lookup して渡す）
 * - removeTitle は i18n 済みの文字列を呼び出し側で解決して渡す（useT 不可のため）
 */
export function RelationListItemView({
  relation,
  fromName,
  fromColor,
  toName,
  toColor,
  onRemove,
  removeTitle,
}: RelationListItemViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <ColorDot color={fromColor} />
        <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{fromName}</span>
      </span>
      <span
        style={{
          fontSize: 12,
          color: relation.color || 'var(--text-muted)',
          padding: '1px 6px',
          background: 'var(--bg-active)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: `3px solid ${relation.color || 'var(--border-strong)'}`,
        }}
      >
        {relation.label}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <ColorDot color={toColor} />
        <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{toName}</span>
      </span>
      <button
        onClick={() => onRemove?.(relation.id)}
        title={removeTitle}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
