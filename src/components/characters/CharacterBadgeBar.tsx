import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';
import { CharacterBadge } from './CharacterBadge';

interface CharacterBadgeBarProps {
  entry: MemoEntry;
  /** 時刻欄分のインデントを追加（タイムラインエントリ用） */
  indent?: boolean;
}

export function CharacterBadgeBar({ entry, indent }: CharacterBadgeBarProps) {
  const characters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  if (characters.length === 0) return null;

  const hasActive = entry.characterTags.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        flexShrink: 0,
        padding: indent ? '1px 10px 1px 62px' : '1px 10px 1px',
        opacity: hasActive ? 1 : 0.5,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = hasActive ? '1' : '0.5'; }}
    >
      {characters.map((char) => (
        <CharacterBadge
          key={char.id}
          color={char.color}
          name={char.name}
          isActive={entry.characterTags.includes(char.id)}
          onClick={() => toggleCharacterTag(entry.id, char.id)}
        />
      ))}
    </div>
  );
}
