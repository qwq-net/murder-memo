import type { MemoEntry } from '../../types/memo';
import { TextEntry } from './TextEntry';

interface EntryCardProps {
  entry: MemoEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  // 型別に描画を分岐（後続TODOで ImageEntry, TimelineEntry 等を追加）
  const renderContent = () => {
    switch (entry.type) {
      case 'image':
        return (
          <div style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: 12 }}>
            [画像]
          </div>
        );
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
