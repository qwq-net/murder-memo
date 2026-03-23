import { RadioGroup } from '@/components/common/radioGroup';
import type { RadioOption } from '@/components/common/radioGroup';

export function SettingRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
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
      <span style={{ fontSize: 14, color: 'var(--text-primary)', flexShrink: 0 }}>{label}</span>
      <RadioGroup options={options} value={value} onChange={onChange} />
    </div>
  );
}
