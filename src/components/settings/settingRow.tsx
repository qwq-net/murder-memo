import type { RadioOption } from '@/components/common/radioGroup';
import { RadioGroup } from '@/components/common/radioGroup';

export function SettingRow<T extends string>({
  label,
  note,
  options,
  value,
  onChange,
}: {
  label: string;
  /** ラベル右に小さく表示する補助テキスト（※WIP 等） */
  note?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        {label}
        {note && (
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{note}</span>
        )}
      </span>
      <RadioGroup options={options} value={value} onChange={onChange} />
    </div>
  );
}
