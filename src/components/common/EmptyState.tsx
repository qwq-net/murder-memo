import { useCallback, useState } from 'react';

interface EmptyStateProps {
  accentColor: string;
  message: string;
  onAddGroup: (label: string) => void;
}

export function EmptyState({ accentColor, message, onAddGroup }: EmptyStateProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = label.trim();
    if (trimmed) {
      onAddGroup(trimmed);
      setLabel('');
    }
    setIsAdding(false);
  }, [label, onAddGroup]);

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text-faint)',
        fontSize: 12,
        lineHeight: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Icon */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: 0.4 }}>
        <rect x="4" y="2" width="20" height="24" rx="3" stroke={accentColor} strokeWidth="1.2" />
        <line x1="9" y1="8" x2="19" y2="8" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
        <line x1="9" y1="12" x2="16" y2="12" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="9" y1="16" x2="18" y2="16" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="9" y1="20" x2="14" y2="20" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>

      <span>{message}</span>

      {/* Add group */}
      {isAdding ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              else if (e.key === 'Escape') { setIsAdding(false); setLabel(''); }
            }}
            placeholder="メモグループ名"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: `1px solid ${accentColor}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              padding: '4px 8px',
              outline: 'none',
              width: 140,
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              background: accentColor,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--bg-base)',
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            background: 'none',
            border: `1px solid ${accentColor}55`,
            borderRadius: 'var(--radius-sm)',
            color: accentColor,
            fontSize: 11,
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}15`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accentColor}55`; e.currentTarget.style.background = 'none'; }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          メモグループを作成
        </button>
      )}
    </div>
  );
}
