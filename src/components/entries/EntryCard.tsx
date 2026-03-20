import { useCallback, useState } from 'react';

import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';
import { CharacterBadgeBar } from '../characters/CharacterBadgeBar';
import { BulkContextMenu } from './actions/BulkContextMenu';
import { EntryContextMenu } from './actions/EntryContextMenu';
import { ImageEntry } from './ImageEntry';
import { useSelection } from './selection-context';
import { TextEntry } from './TextEntry';
import { TimelineEntry } from './TimelineEntry';

interface EntryCardProps {
  entry: MemoEntry;
  hideTime?: boolean;
}

const PANEL_ACCENT: Record<string, string> = {
  free:     'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

const IMPORTANCE_COLOR: Record<string, string> = {
  high:   'var(--importance-high)',
  medium: 'var(--importance-medium)',
  low:    'var(--importance-low)',
};

const IMPORTANCE_LABEL: Record<string, string> = {
  high:   '!!!',
  medium: '!!',
  low:    '!',
};

export function EntryCard({ entry, hideTime }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [bulkCtxMenu, setBulkCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const accent = PANEL_ACCENT[entry.panel] ?? 'var(--border-default)';

  const { isSelected, selectedIds, clearSelection } = useSelection();
  const entries = useStore((s) => s.entries);
  const selected = isSelected(entry.id);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedIds.size > 1 && selectedIds.has(entry.id)) {
      setBulkCtxMenu({ x: e.clientX, y: e.clientY });
    } else {
      setCtxMenu({ x: e.clientX, y: e.clientY });
    }
  }, [selectedIds, entry.id]);

  const selectedEntries = bulkCtxMenu
    ? entries.filter((e) => selectedIds.has(e.id))
    : [];

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

  const importanceColor = entry.importance ? IMPORTANCE_COLOR[entry.importance] : null;
  const importanceLabel = entry.importance ? IMPORTANCE_LABEL[entry.importance] : null;

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
      {/* 左縦線 — パネルアイデンティティ専用。選択時はアクセント強調 */}
      <div
        style={{
          position: 'absolute',
          left: entry.type === 'timeline' ? 57 : 4,
          top: 2,
          bottom: 2,
          width: selected ? 3 : 2,
          borderRadius: 2,
          background: selected ? 'var(--accent)' : accent,
          opacity: selected ? 0.9 : (hovered ? 0.45 : 0.2),
          transition: 'opacity 0.12s, width 0.12s, background 0.12s',
          pointerEvents: 'none',
        }}
      />

      {/* 重要度マーカー — 右端に表示 */}
      {importanceColor && importanceLabel && (
        <div
          style={{
            position: 'absolute',
            right: 6,
            top: 4,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: importanceColor,
            opacity: hovered ? 0.9 : 0.6,
            transition: 'opacity 0.12s',
            pointerEvents: 'none',
            lineHeight: 1,
            letterSpacing: '-0.05em',
          }}
        >
          {importanceLabel}
        </div>
      )}

      {/* Row 1: Character badges */}
      <CharacterBadgeBar entry={entry} indent={entry.type === 'timeline'} />

      {/* Row 2: Content */}
      <div style={{ minWidth: 0 }}>
        {renderContent()}
      </div>

      {/* 単体コンテキストメニュー */}
      {ctxMenu && (
        <EntryContextMenu
          entry={entry}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* 一括コンテキストメニュー */}
      {bulkCtxMenu && (
        <BulkContextMenu
          entries={selectedEntries}
          x={bulkCtxMenu.x}
          y={bulkCtxMenu.y}
          onClose={() => setBulkCtxMenu(null)}
          onDone={() => {
            setBulkCtxMenu(null);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}
