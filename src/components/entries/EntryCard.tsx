import type { MemoEntry } from '../../types/memo';
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
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      {renderContent()}
    </div>
  );
}
