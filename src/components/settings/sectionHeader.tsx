export function SectionHeader({
  children,
  hint,
  onReset,
  resetDisabled,
}: {
  children: React.ReactNode;
  hint?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
}) {
  return (
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
          リセット
        </button>
      )}
    </div>
  );
}
