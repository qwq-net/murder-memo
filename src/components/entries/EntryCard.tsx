import { useCallback, useState } from 'react';

import type { MemoEntry } from '../../types/memo';
import { CharacterBadgeBar } from '../characters/CharacterBadgeBar';
import { EntryContextMenu } from './actions/EntryContextMenu';
import { ImageEntry } from './ImageEntry';
import { TextEntry } from './TextEntry';

interface EntryCardProps {
  entry: MemoEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

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
      onContextMenu={handleContextMenu}
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

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <EntryContextMenu
          entry={entry}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
