import { useCallback, useState } from 'react';

import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { CharacterBadgeBar } from '@/components/characters/characterBadgeBar';
import { IconImportance } from '@/components/icons';
import { BulkContextMenu } from '@/components/entries/actions/bulkContextMenu';
import { EntryContextMenu } from '@/components/entries/actions/entryContextMenu';
import { ImageEntry } from '@/components/entries/imageEntry';
import { useSelection } from '@/components/entries/selectionContext';
import { TextEntry } from '@/components/entries/textEntry';
import { TimelineEntry } from '@/components/entries/timelineEntry';

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

export function EntryCard({ entry, hideTime }: EntryCardProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [bulkCtxMenu, setBulkCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const accent = PANEL_ACCENT[entry.panel] ?? 'var(--border-default)';

  const { isSelected, selectedIds, clearSelection } = useSelection();
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

  // bulkCtxMenu表示時のみentriesを取得（全EntryCardの不要な再レンダーを回避）
  const selectedEntries = bulkCtxMenu
    ? useStore.getState().entries.filter((e) => selectedIds.has(e.id))
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
      className="flex flex-col relative p-0 my-[4px] rounded-sm"
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'color-mix(in srgb, var(--bg-hover) 50%, transparent)'
          : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* 重要度グラデーション — 右から左へ薄くフェード */}
      {importanceColor && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${importanceColor}, transparent 60%)`,
            opacity: hovered ? 0.1 : 0.06,
            transition: 'opacity 0.12s',
          }}
        />
      )}

      {/* 左縦線 — パネルアイデンティティ専用。選択時はアクセント強調 */}
      <div
        className="absolute rounded-sm pointer-events-none"
        style={{
          left: entry.type === 'timeline' ? 'var(--tl-content-left)' : 4,
          top: entry.type === 'timeline' ? -1 : 2,
          bottom: entry.type === 'timeline' ? -1 : 2,
          width: selected ? 4 : 3,
          background: selected ? 'var(--accent)' : accent,
          opacity: selected ? 0.9 : (hovered ? 0.6 : 0.45),
          transition: 'opacity 0.12s, width 0.12s, background 0.12s',
        }}
      />

      {/* タイムラインマーカー — ドット + 水平ティック */}
      {entry.type === 'timeline' && !!entry.eventTime && !hideTime && (
        <>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: 'calc(var(--tl-spine-x) - 6px)',
              top: 12,
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              background: selected
                ? 'var(--accent)'
                : 'var(--panel-timeline-accent)',
              opacity: selected ? 1 : (hovered ? 0.8 : 0.45),
              transition: 'opacity 0.12s',
            }}
          />
          {/* 水平ティック — ドットから右へ伸びる接続線 */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: 'calc(var(--tl-spine-x) - 6px + 3px)',
              top: 14,
              width: 8,
              height: 1,
              background: selected
                ? 'var(--accent)'
                : 'var(--panel-timeline-accent)',
              opacity: selected ? 0.8 : (hovered ? 0.5 : 0.2),
              transition: 'opacity 0.12s',
            }}
          />
        </>
      )}


      {/* 重要度マーカー — エントリ全体の右端・上下中央 */}
      {importanceColor && (
        <IconImportance
          color={importanceColor}
          className="absolute pointer-events-none"
          style={{
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: hovered ? 0.9 : 0.6,
            transition: 'opacity 0.12s',
          }}
        />
      )}

      {/* Row 1: Content */}
      <div className="min-w-0" style={{ paddingRight: importanceColor ? 20 : 0 }}>
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
