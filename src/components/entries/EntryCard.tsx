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

const IMPORTANCE_ICON_SIZE = 14;

export function EntryCard({ entry, hideTime }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [bulkCtxMenu, setBulkCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const accent = PANEL_ACCENT[entry.panel] ?? 'var(--border-default)';

  const { isSelected, selectedIds, clearSelection } = useSelection();
  const entries = useStore((s) => s.entries);
  const settings = useStore((s) => s.settings);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const selected = isSelected(entry.id);
  const isEditing = focusedEntryId === entry.id;

  const panelDefault = settings.defaultCharacterDisplay[entry.panel];
  const effectiveFormat = entry.characterDisplayFormat ?? panelDefault.format;
  const effectiveVisibility = entry.characterDisplayVisibility ?? panelDefault.visibility;

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

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '0',
        margin: '2px 0',
        borderRadius: 'var(--radius-sm)',
        background: hovered
          ? 'color-mix(in srgb, var(--bg-hover) 50%, transparent)'
          : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* 重要度グラデーション — 右から左へ薄くフェード */}
      {importanceColor && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `linear-gradient(to left, ${importanceColor}, transparent 60%)`,
            opacity: hovered ? 0.1 : 0.06,
            transition: 'opacity 0.12s',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 左縦線 — パネルアイデンティティ専用。選択時はアクセント強調 */}
      <div
        style={{
          position: 'absolute',
          left: entry.type === 'timeline' ? 65 : 4,
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

      {/* タイムラインマーカー — ドット + 水平ティック */}
      {entry.type === 'timeline' && !!entry.eventTime && !hideTime && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 'calc(var(--tl-spine-x) - 6px)',
              top: 12,
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: selected
                ? 'var(--accent)'
                : 'var(--panel-timeline-accent)',
              opacity: selected ? 1 : (hovered ? 0.8 : 0.45),
              transition: 'opacity 0.12s',
              pointerEvents: 'none',
            }}
          />
          {/* 水平ティック — ドットから右へ伸びる接続線 */}
          <div
            style={{
              position: 'absolute',
              left: 'calc(var(--tl-spine-x) - 6px + 3px)',
              top: 14,
              width: 8,
              height: 1,
              background: selected
                ? 'var(--accent)'
                : 'var(--panel-timeline-accent)',
              opacity: selected ? 0.8 : (hovered ? 0.5 : 0.2),
              transition: 'opacity 0.12s',
              pointerEvents: 'none',
            }}
          />
        </>
      )}


      {/* 重要度マーカー — エントリ全体の右端・上下中央 */}
      {importanceColor && (
        <svg
          width={IMPORTANCE_ICON_SIZE}
          height={IMPORTANCE_ICON_SIZE}
          viewBox="0 0 16 16"
          fill="none"
          style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: hovered ? 0.9 : 0.6,
            transition: 'opacity 0.12s',
            pointerEvents: 'none',
          }}
        >
          <circle cx="8" cy="8" r="7" stroke={importanceColor} strokeWidth="1.5" />
          <line x1="8" y1="7" x2="8" y2="12" stroke={importanceColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="4.5" r="1" fill={importanceColor} />
        </svg>
      )}

      {/* Row 1: Content */}
      <div style={{ minWidth: 0, paddingRight: importanceColor ? 20 : 0 }}>
        {renderContent()}
      </div>

      {/* Row 2: Character badges */}
      <CharacterBadgeBar
        entry={entry}
        indent={entry.type === 'timeline'}
        format={effectiveFormat}
        visibility={effectiveVisibility}
        isEntryHovered={(hovered && !ctxMenu && !bulkCtxMenu) || isEditing}
      />

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
