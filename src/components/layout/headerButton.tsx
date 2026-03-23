const DEFAULT_STYLE: React.CSSProperties = {
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
};

const SETTINGS_STYLE: React.CSSProperties = {
  ...DEFAULT_STYLE,
  gap: 8,
  border: '1px solid color-mix(in srgb, var(--color-settings-accent) 40%, transparent)',
  color: 'var(--color-settings-accent)',
};

const HOVER = {
  default: {
    color: 'var(--text-primary)',
    borderColor: 'var(--header-btn-border-hover)',
  },
  settings: {
    color: '#d9683a',
    borderColor: 'color-mix(in srgb, var(--color-settings-accent) 70%, transparent)',
  },
} as const;

const REST = {
  default: {
    color: 'var(--text-secondary)',
    borderColor: 'var(--header-btn-border)',
  },
  settings: {
    color: 'var(--color-settings-accent)',
    borderColor: 'color-mix(in srgb, var(--color-settings-accent) 40%, transparent)',
  },
} as const;

interface HeaderButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'settings';
}

export function HeaderButton({ onClick, children, variant = 'default' }: HeaderButtonProps) {
  const style = variant === 'settings' ? SETTINGS_STYLE : DEFAULT_STYLE;
  const hover = HOVER[variant];
  const rest = REST[variant];

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hover.color;
        e.currentTarget.style.borderColor = hover.borderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = rest.color;
        e.currentTarget.style.borderColor = rest.borderColor;
      }}
    >
      {children}
    </button>
  );
}
