import { useMemo } from 'react';

import { navigateToEntry } from '@/lib/entryNavigation';
import type { MemoEntry, PanelId } from '@/types/memo';

/** エントリのプレビュー文字列（最大40文字） */
function entryPreview(e: MemoEntry): string {
  if (e.type === 'image') return e.content ? `[画像] ${e.content}` : '[画像]';
  const text = e.content || '（空）';
  return text.length > 40 ? text.slice(0, 40) + '…' : text;
}

/** リンクポップオーバー — 双方向リンクを表示しジャンプ可能にする */
export function LinkPopover({
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
