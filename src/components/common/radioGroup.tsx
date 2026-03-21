/**
 * セグメントコントロール（ラジオグループ）。
 * SettingsPanel の RadioGroup と CharacterSetupPanel の ToggleGroup を統合。
 */

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** true: 均等幅で親を埋める / false: コンテンツ幅（デフォルト） */
  stretch?: boolean;
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  stretch,
}: RadioGroupProps<T>) {
  return (
    <div
      style={{
        display: stretch ? 'flex' : 'inline-flex',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            style={{
              flex: stretch ? 1 : undefined,
              background: active ? 'rgba(196, 90, 42, 0.15)' : 'transparent',
              border: 'none',
              borderLeft: i > 0 ? '1px solid var(--border-default)' : 'none',
              color: opt.disabled
                ? 'var(--text-muted)'
                : active
                  ? '#c45a2a'
                  : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              padding: stretch ? '5px 0' : '5px 14px',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              transition: 'background 0.12s, color 0.12s',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
