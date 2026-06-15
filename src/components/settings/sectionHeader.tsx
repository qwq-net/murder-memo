import { useT } from '@/i18n';

/** セクション間の区切り線（divider 指定時にヘッダーを囲むラッパー） */
const DIVIDER_STYLE: React.CSSProperties = {
  borderTop: '1px solid var(--border-subtle)',
  marginTop: 6,
};

export function SectionHeader({
  children,
  hint,
  onReset,
  resetDisabled,
  divider,
}: {
  children: React.ReactNode;
  hint?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  /** 上端に区切り線を引く（前セクションとの境界）。設定パネルの各セクション見出しで使う */
  divider?: boolean;
}) {
  const t = useT();

  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '12px 0 6px',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.06em',
        }}
      >
        {children}
      </span>
      {hint && (
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>
          {hint}
        </span>
      )}
      {onReset && (
        <button
          disabled={resetDisabled}
          onClick={onReset}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            fontSize: 14,
            color: resetDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: resetDisabled ? 'default' : 'pointer',
            padding: '0 2px',
            transition: 'color 0.12s',
          }}
        >
          {t('common.reset')}
        </button>
      )}
    </div>
  );

  return divider ? <div style={DIVIDER_STYLE}>{header}</div> : header;
}
