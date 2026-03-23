import type { CharacterDisplayFormat } from '@/types/memo';

interface CharacterBadgeProps {
  color: string;
  name: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  format: CharacterDisplayFormat;
  /** カスタム aria-label（省略時はタグ付け用のデフォルトラベル） */
  ariaLabel?: string;
}

export function CharacterBadge({ color, name, isActive, onClick, format, ariaLabel }: CharacterBadgeProps) {
  const displayName = name.length > 5 ? name.slice(0, 5) + '…' : name;
  const label = ariaLabel ?? `${name}${isActive ? 'のタグを外す' : 'をタグ付け'}`;

  if (format === 'text') {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={isActive}
        title={name}
        style={{
          background: isActive ? `color-mix(in srgb, ${color} 18%, transparent)` : 'transparent',
          border: isActive ? `1px solid color-mix(in srgb, ${color} 40%, transparent)` : '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          color: isActive ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          lineHeight: 1,
          padding: '2px 5px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.12s, color 0.12s, border-color 0.12s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = color;
            e.currentTarget.style.background = `color-mix(in srgb, ${color} 10%, transparent)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = `color-mix(in srgb, ${color} 35%, transparent)`;
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {displayName}
      </button>
    );
  }

  const badge = (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: isActive ? color : `color-mix(in srgb, ${color} 5%, transparent)`,
        border: isActive ? `1.5px solid color-mix(in srgb, ${color}, black 20%)` : `1.5px solid color-mix(in srgb, ${color} 14%, transparent)`,
        flexShrink: 0,
        display: 'inline-block',
        boxSizing: 'border-box',
      }}
    />
  );

  if (format === 'full') {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={isActive}
        title={name}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          padding: '1px 4px 1px 0',
          flexShrink: 0,
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `color-mix(in srgb, ${color} 8%, transparent)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {badge}
        <span
          style={{
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>
      </button>
    );
  }

  // format === 'badge'（既存の動作）
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title={name}
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: isActive ? color : `color-mix(in srgb, ${color} 5%, transparent)`,
        border: isActive ? `1.5px solid color-mix(in srgb, ${color}, black 20%)` : `1.5px solid color-mix(in srgb, ${color} 14%, transparent)`,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
        transform: isActive ? 'scale(1)' : 'scale(0.9)',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = `color-mix(in srgb, ${color} 35%, transparent)`;
          e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 40%, transparent)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = `color-mix(in srgb, ${color} 8%, transparent)`;
          e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 14%, transparent)`;
        }
      }}
    />
  );
}
