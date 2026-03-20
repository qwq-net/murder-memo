import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';
import { CharacterBadge } from './CharacterBadge';

interface CharacterBadgeBarProps {
  entry: MemoEntry;
}

export function CharacterBadgeBar({ entry }: CharacterBadgeBarProps) {
  const characters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  if (characters.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        alignItems: 'center',
        flexShrink: 0,
        padding: '0 2px',
      }}
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
