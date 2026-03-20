interface CharacterBadgeProps {
  color: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

export function CharacterBadge({ color, name, isActive, onClick }: CharacterBadgeProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`${name}${isActive ? 'のタグを外す' : 'をタグ付け'}`}
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
