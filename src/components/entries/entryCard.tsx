import { useCallback, useMemo, useState } from 'react';

import { navigateToEntry } from '@/lib/entryNavigation';
import { useStore } from '@/store';
import type { MemoEntry, PanelId } from '@/types/memo';
import { IconImportance } from '@/components/icons';
import { BulkContextMenu } from '@/components/entries/actions/bulkContextMenu';
import { EntryContextMenu } from '@/components/entries/actions/entryContextMenu';
import { ImageEntry } from '@/components/entries/imageEntry';
import { LinkEntryModal } from '@/components/entries/linkEntryModal';
import { useSelection } from '@/components/entries/selectionContext';
import { TextEntry } from '@/components/entries/textEntry';
import { TimelineEntry } from '@/components/entries/timelineEntry';

/** エントリのプレビュー文字列（最大40文字） */
function entryPreview(e: MemoEntry): string {
  if (e.type === 'image') return e.content ? `[画像] ${e.content}` : '[画像]';
  const text = e.content || '（空）';
  return text.length > 40 ? text.slice(0, 40) + '…' : text;
}

/** リンクポップオーバー — 双方向リンクを表示しジャンプ可能にする */
function LinkPopover({
  entry,
  entries,
  hovered,
  setActivePanel,
  linkPopoverOpen,
  setLinkPopoverOpen,
}: {
  entry: MemoEntry;
  entries: MemoEntry[];
  hovered: boolean;
  setActivePanel: (panel: PanelId) => void;
  linkPopoverOpen: boolean;
  setLinkPopoverOpen: (open: boolean | ((v: boolean) => boolean)) => void;
}) {
  // 双方向リンクの統合: 自分→他 (forward) + 他→自分 (reverse)
  const allLinkedIds = useMemo(() => {
    const forward = new Set(entry.linkedEntryIds ?? []);
    for (const e of entries) {
      if (e.id !== entry.id && e.linkedEntryIds?.includes(entry.id)) {
        forward.add(e.id);
      }
    }
    return forward;
  }, [entry.id, entry.linkedEntryIds, entries]);

  if (allLinkedIds.size === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setLinkPopoverOpen((v: boolean) => !v)}
        title={`${allLinkedIds.size}件のリンク`}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          padding: 0,
          opacity: hovered || linkPopoverOpen ? 0.9 : 0.5,
          transition: 'opacity 0.12s',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 11,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5l3-3M9 4l1.5-1.5a2.12 2.12 0 0 1 3 3L12 7M7 9l-1.5 1.5a2.12 2.12 0 0 1-3-3L4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {linkPopoverOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: '100%',
            marginBottom: 4,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px var(--shadow-menu)',
            padding: '4px 0',
            minWidth: 200,
            maxWidth: 300,
            zIndex: 50,
          }}
        >
          {[...allLinkedIds].map((linkedId) => {
            const linked = entries.find((e) => e.id === linkedId);
            if (!linked) return null;
            return (
              <button
                key={linkedId}
                onClick={() => {
                  setLinkPopoverOpen(false);
                  navigateToEntry(linkedId, linked.panel, setActivePanel);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '4px 10px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                {entryPreview(linked)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const entries = useStore((s) => s.entries);
  const setActivePanel = useStore((s) => s.setActivePanel);
  const accent = PANEL_ACCENT[entry.panel] ?? 'var(--border-default)';

  const { isSelected, selectedIds, clearSelection } = useSelection();
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const selected = isSelected(entry.id);
  const isEditing = focusedEntryId === entry.id;
  const isEntryHovered = (hovered && !ctxMenu && !bulkCtxMenu) || isEditing;

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
        return <ImageEntry entry={entry} isHovered={isEntryHovered} />;
      case 'timeline':
        return <TimelineEntry entry={entry} hideTime={hideTime} isHovered={isEntryHovered} />;
      default:
        return <TextEntry entry={entry} isHovered={isEntryHovered} />;
    }
  };

  const importanceColor = entry.importance ? IMPORTANCE_COLOR[entry.importance] : null;
  return (
    <div
      data-entry-id={entry.id}
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
          top: -1,
          bottom: -1,
          width: selected ? 4 : 3,
          background: selected ? 'var(--accent)' : accent,
          opacity: selected ? 0.9 : (hovered ? 0.6 : 0.45),
          transition: 'opacity 0.12s, width 0.12s, background 0.12s',
        }}
      />

      {/* タイムラインマーカー — ドット + 水平ティック (SVG) */}
      {entry.type === 'timeline' && !!entry.eventTime && !hideTime && (
        <svg
          className="absolute pointer-events-none"
          width="14"
          height="5"
          viewBox="0 0 14 5"
          style={{
            left: 'calc(var(--tl-spine-x) - 8.6px)',
            top: 10,
            transition: 'opacity 0.12s',
          }}
        >
          <circle
            cx="2.5"
            cy="2.5"
            r="2.5"
            fill={selected ? 'var(--accent)' : 'var(--panel-timeline-accent)'}
            opacity={selected ? 1 : (hovered ? 0.8 : 0.45)}
          />
          <line
            x1="5"
            y1="2.5"
            x2="14"
            y2="2.5"
            stroke={selected ? 'var(--accent)' : 'var(--panel-timeline-accent)'}
            strokeWidth="1"
            opacity={selected ? 0.8 : (hovered ? 0.5 : 0.2)}
          />
        </svg>
      )}

      {/* コンテンツ + 右端インジケータ群 を横並びで配置 */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* コンテンツ */}
        <div className="min-w-0" style={{ flex: 1 }}>
          {renderContent()}
        </div>

        {/* 右端インジケータ列 — 重要度は上下中央、リンクは右下 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            flexShrink: 0,
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {/* 重要度 — 上下中央 (flex:1 で上下均等スペース) */}
          {importanceColor && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <IconImportance
                size={12}
                color={importanceColor}
                className="pointer-events-none"
                style={{
                  opacity: hovered ? 0.9 : 0.6,
                  transition: 'opacity 0.12s',
                }}
              />
            </div>
          )}

          {/* リンク — 下端に寄る */}
          <LinkPopover
            entry={entry}
            entries={entries}
            hovered={hovered}
            setActivePanel={setActivePanel}
            linkPopoverOpen={linkPopoverOpen}
            setLinkPopoverOpen={setLinkPopoverOpen}
          />
        </div>
      </div>

      {/* 単体コンテキストメニュー */}
      {ctxMenu && (
        <EntryContextMenu
          entry={entry}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onLinkRequest={() => { setCtxMenu(null); setLinkModalOpen(true); }}
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

      {/* リンク設定モーダル */}
      {linkModalOpen && (
        <LinkEntryModal
          entry={entry}
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
        />
      )}
    </div>
  );
}
