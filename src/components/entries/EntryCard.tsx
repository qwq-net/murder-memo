import type { MemoEntry } from '../../types/memo';
import { CharacterBadgeBar } from '../characters/CharacterBadgeBar';
import { ImageEntry } from './ImageEntry';
import { TextEntry } from './TextEntry';

interface EntryCardProps {
  entry: MemoEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const renderContent = () => {
    switch (entry.type) {
      case 'image':
        return <ImageEntry entry={entry} />;
      default:
        return <TextEntry entry={entry} />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 4,
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        padding: '2px 0',
      }}
    >
      {/* Badge bar (left) */}
      <div style={{ paddingTop: 6, paddingLeft: 4 }}>
        <CharacterBadgeBar entry={entry} />
      </div>

      {/* Content (fills remaining space) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
      </div>
    </div>
  );
}
