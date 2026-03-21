import { useCallback, useState } from 'react';

import type { MemoEntry, MemoGroup } from '../../types/memo';
import { ConfirmModal } from '../common/ConfirmModal';
import { SortableEntryList } from '../entries/SortableEntryList';
import { IconChevronDown, IconClose, IconEditSquare } from '../icons';

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
        className="flex items-center gap-2 px-2.5 py-[7px] cursor-pointer select-none"
        style={{
          background: isUncategorized
            ? 'color-mix(in srgb, var(--text-muted) 5%, transparent)'
            : `color-mix(in srgb, ${accentColor} 5%, transparent)`,
          borderBottom: isUncategorized
            ? '1px solid color-mix(in srgb, var(--text-muted) 10%, transparent)'
            : `1px solid color-mix(in srgb, ${accentColor} 12%, transparent)`,
        }}
      >
        {/* 折りたたみ矢印 */}
        <span
          className="flex items-center shrink-0 transition-transform duration-150"
          style={{
            color: isUncategorized ? 'var(--text-muted)' : accentColor,
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <IconChevronDown />
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
            className="flex-1 bg-bg-base rounded-sm text-xs font-semibold px-1.5 py-px outline-none"
            style={{
              border: `1px solid ${accentColor}`,
              color: accentColor,
            }}
          />
        ) : (
          <span
            className="flex-1 text-xs tracking-[0.06em]"
            style={{
              fontWeight: isUncategorized ? 400 : 600,
              color: isUncategorized ? 'var(--text-muted)' : accentColor,
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
            className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
            style={{
              opacity: headerHovered ? 0.8 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <IconEditSquare />
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
            className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
            style={{
              opacity: headerHovered ? 1 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <IconClose />
          </button>
        )}

        {/* エントリ数 — 常に右端 */}
        <span className="text-xs text-text-muted font-mono min-w-4 text-right opacity-70 shrink-0">
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
          <div className="py-3.5 px-3 text-xs text-text-faint text-center">
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
