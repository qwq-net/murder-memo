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

type Variant = 'default' | 'settings';

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  title?: string;
}

interface ButtonProps extends BaseProps {
  onClick: () => void;
  href?: undefined;
}

interface LinkProps extends BaseProps {
  href: string;
  target?: string;
  rel?: string;
  onClick?: undefined;
}

type HeaderButtonProps = ButtonProps | LinkProps;

/**
 * ヘッダー右側の操作ボタン群と、ロゴ隣の使い方リンクで共通利用する小型ボタン。
 *
 * - `onClick` を渡せば `<button>` として描画
 * - `href` を渡せば `<a>` として描画（target/rel を併用可）
 * - スタイル（border / color / hover）は両者で完全に一致させる
 */
export function HeaderButton(props: HeaderButtonProps) {
  const { children, variant = 'default', title } = props;
  const style = variant === 'settings' ? SETTINGS_STYLE : DEFAULT_STYLE;
  const hover = HOVER[variant];
  const rest = REST[variant];

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = hover.color;
      e.currentTarget.style.borderColor = hover.borderColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = rest.color;
      e.currentTarget.style.borderColor = rest.borderColor;
    },
  };

  if (props.href !== undefined) {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        title={title}
        style={{ ...style, textDecoration: 'none' }}
        {...hoverHandlers}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={props.onClick} title={title} style={style} {...hoverHandlers}>
      {children}
    </button>
  );
}
