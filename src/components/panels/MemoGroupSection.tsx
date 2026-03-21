import { useCallback, useState } from 'react';

import type { MemoEntry, MemoGroup } from '../../types/memo';
import { ConfirmModal } from '../common/ConfirmModal';
import { SortableEntryList } from '../entries/SortableEntryList';

interface MemoGroupSectionProps {
  group: MemoGroup | null; // null = 未分類
  entries: MemoEntry[];
  accentColor: string;
  onToggleCollapse?: (id: string) => void;
  onRemove?: (id: string) => Promise<void>;
  onUpdate?: (id: string, patch: Partial<Pick<MemoGroup, 'label' | 'collapsed'>>) => Promise<void>;
  onReorderEntries: (orderedIds: string[]) => void;
}

export function MemoGroupSection({
  group,
  entries,
  accentColor,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onReorderEntries,
}: MemoGroupSectionProps) {
  const isUncategorized = group === null;
  const label = group?.label ?? '未分類';

  const [uncategorizedCollapsed, setUncategorizedCollapsed] = useState(false);
  const collapsed = isUncategorized ? uncategorizedCollapsed : (group?.collapsed ?? false);

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const saveLabel = useCallback(() => {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== group?.label && group && onUpdate) {
      onUpdate(group.id, { label: trimmed });
    }
    setIsEditingLabel(false);
  }, [draftLabel, group, onUpdate]);

  const handleToggle = () => {
    if (isUncategorized) {
      setUncategorizedCollapsed((v) => !v);
    } else if (group && onToggleCollapse) {
      onToggleCollapse(group.id);
    }
  };

  return (
    <div>
      {/* グループヘッダー */}
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        onClick={isEditingLabel ? undefined : handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          background: isUncategorized
            ? 'color-mix(in srgb, var(--text-muted) 5%, transparent)'
            : `color-mix(in srgb, ${accentColor} 5%, transparent)`,
          borderBottom: isUncategorized
            ? '1px solid color-mix(in srgb, var(--text-muted) 10%, transparent)'
            : `1px solid color-mix(in srgb, ${accentColor} 12%, transparent)`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* 折りたたみ矢印 */}
        <span
          style={{
            color: isUncategorized ? 'var(--text-muted)' : accentColor,
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.15s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        {/* ラベル */}
        {!isUncategorized && isEditingLabel ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={saveLabel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveLabel();
              if (e.key === 'Escape') {
                setDraftLabel(group?.label ?? '');
                setIsEditingLabel(false);
              }
            }}
            aria-label="メモグループ名を編集"
            style={{
              flex: 1,
              background: 'var(--bg-base)',
              border: `1px solid ${accentColor}`,
              borderRadius: 'var(--radius-sm)',
              color: accentColor,
              fontSize: 12,
              fontWeight: 600,
              padding: '1px 6px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: isUncategorized ? 400 : 600,
              color: isUncategorized ? 'var(--text-muted)' : accentColor,
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </span>
        )}

        {/* 編集ボタン — ユーザー作成グループのみ、ホバー時表示 */}
        {!isUncategorized && group && onUpdate && !isEditingLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDraftLabel(group.label);
              setIsEditingLabel(true);
            }}
            title="メモグループ名を変更"
            aria-label={`${group.label}の名前を変更`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, opacity 0.15s',
              opacity: headerHovered ? 0.8 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* 削除ボタン — ユーザー作成グループのみ、ホバー時表示 */}
        {!isUncategorized && group && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (entries.length > 0) {
                setDeleteModalOpen(true);
              } else {
                onRemove(group.id);
              }
            }}
            title="メモグループを削除"
            aria-label={`${group.label}を削除`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '0 2px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s, opacity 0.15s',
              opacity: headerHovered ? 1 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="3" y1="3" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* エントリ数 — 常に右端 */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            minWidth: 16,
            textAlign: 'right',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          {entries.length}
        </span>
      </div>

      {/* エントリリスト */}
      {!collapsed && (
        entries.length > 0 ? (
          <SortableEntryList
            entries={entries}
            onReorder={onReorderEntries}
          />
        ) : !isUncategorized ? (
          <div
            style={{
              padding: '14px 12px',
              fontSize: 12,
              color: 'var(--text-faint)',
              textAlign: 'center',
            }}
          >
            メモを追加してください
          </div>
        ) : null
      )}

      {/* 削除確認モーダル */}
      {group && onRemove && (
        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={`「${group.label}」を削除`}
          confirmationLabel={`未分類へメモが ${entries.length}件 移動することを理解しました`}
          actions={[
            {
              label: '削除',
              color: 'var(--danger)',
              requiresConfirmation: true,
              onClick: () => onRemove(group.id),
            },
          ]}
        />
      )}
    </div>
  );
}
