import { useCallback, useState } from 'react';

import type { MemoEntry } from '../../types/memo';
import { CharacterBadgeBar } from '../characters/CharacterBadgeBar';
import { EntryContextMenu } from './actions/EntryContextMenu';
import { ImageEntry } from './ImageEntry';
import { TextEntry } from './TextEntry';
import { TimelineEntry } from './TimelineEntry';

interface EntryCardProps {
  entry: MemoEntry;
  hideTime?: boolean;
}

export function EntryCard({ entry, hideTime }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const renderContent = () => {
    switch (entry.type) {
      case 'image':
        return <ImageEntry entry={entry} />;
      case 'timeline':
        return <TimelineEntry entry={entry} hideTime={hideTime} />;
      default:
        return <TextEntry entry={entry} />;
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '1px 0',
        borderRadius: 'var(--radius-sm)',
        background: hovered
          ? 'color-mix(in srgb, var(--bg-hover) 50%, transparent)'
          : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* Row 1: Character badges — テキスト開始位置に揃える */}
      <CharacterBadgeBar entry={entry} indent={entry.type === 'timeline'} />

      {/* Row 2: Content (time + text) */}
      <div style={{ minWidth: 0 }}>
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
