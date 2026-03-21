import { useCallback, useState } from 'react';

import { IconPlus } from '@/components/icons';

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
    <div className="flex flex-col items-center gap-3 py-10 px-5 text-center text-xs text-text-faint leading-8">
      {/* アイコン */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="opacity-40">
        <rect x="4" y="2" width="20" height="24" rx="3" stroke={accentColor} strokeWidth="1.2" />
        <line x1="9" y1="8" x2="19" y2="8" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
        <line x1="9" y1="12" x2="16" y2="12" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="9" y1="16" x2="18" y2="16" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="9" y1="20" x2="14" y2="20" stroke={accentColor} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>

      <span>{message}</span>

      {/* グループ追加 */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              else if (e.key === 'Escape') { setIsAdding(false); setLabel(''); }
            }}
            placeholder="メモグループ名"
            className="input-base"
            style={{ border: `1px solid ${accentColor}`, width: 140 }}
          />
          <button
            onClick={handleSubmit}
            className="btn-sm shrink-0 cursor-pointer font-semibold"
            style={{
              background: accentColor,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--bg-base)',
            }}
          >
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-xs cursor-pointer transition-[border-color,background] duration-150"
          style={{
            background: 'none',
            border: `1px solid ${accentColor}55`,
            borderRadius: 'var(--radius-sm)',
            color: accentColor,
            padding: '5px 12px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}15`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accentColor}55`; e.currentTarget.style.background = 'none'; }}
        >
          <IconPlus size={12} />
          メモグループを作成
        </button>
      )}
    </div>
  );
}
