import { useState } from 'react';

import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { useStore } from '@/store';
import type { MemoEntry, MemoGroup, PanelId } from '@/types/memo';
import { ConfirmModal } from '@/components/common/confirmModal';
import { SortableEntryList } from '@/components/entries/sortableEntryList';
import { ArrowDown, ArrowUp, ChevronDown, SquarePen, X } from '@/components/icons';

interface MemoGroupSectionProps {
  group: MemoGroup | null; // null = 未分類
  panel: PanelId;
  entries: MemoEntry[];
  accentColor: string;
  onToggleCollapse?: (id: string) => void;
  onRemove?: (id: string) => Promise<void>;
  onUpdate?: (id: string, patch: Partial<Pick<MemoGroup, 'label' | 'collapsed'>>) => Promise<void>;
  onReorderEntries: (orderedIds: string[]) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function MemoGroupSection({
  group,
  entries,
  accentColor,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onReorderEntries,
  onMoveUp,
  onMoveDown,
  panel,
}: MemoGroupSectionProps) {
  const isUncategorized = group === null;
  const label = group?.label ?? '未分類';

  const uncategorizedCollapsed = useStore((s) => s.uncategorizedCollapsed[panel] ?? false);
  const setUncategorizedCollapsed = useStore((s) => s.setUncategorizedCollapsed);
  const collapsed = isUncategorized ? uncategorizedCollapsed : (group?.collapsed ?? false);

  const [headerHovered, setHeaderHovered] = useState(false);

  const labelEditor = useGroupLabelEditor({
    initialLabel: group?.label ?? '',
    onSave: (newLabel) => { if (group && onUpdate) onUpdate(group.id, { label: newLabel }); },
    toastMessage: 'グループ名を変更しました',
  });

  const deleteConfirm = useDeleteWithConfirmation(
    entries.length > 0,
    () => { if (group && onRemove) return onRemove(group.id); },
    'グループを削除しました',
  );

  const handleToggle = () => {
    if (isUncategorized) {
      setUncategorizedCollapsed(panel, !uncategorizedCollapsed);
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
        onClick={labelEditor.isEditing ? undefined : handleToggle}
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
          <ChevronDown size={12} />
        </span>

        {/* ラベル */}
        {!isUncategorized && labelEditor.isEditing ? (
          <input
            autoFocus
            value={labelEditor.draftLabel}
            onChange={(e) => labelEditor.setDraftLabel(e.target.value)}
            onBlur={labelEditor.saveLabel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={labelEditor.handleKeyDown}
            aria-label="メモグループ名を編集"
            className="flex-1 bg-bg-base rounded-sm text-sm font-semibold px-1.5 py-px outline-none"
            style={{
              border: `1px solid ${accentColor}`,
              color: accentColor,
            }}
          />
        ) : (
          <span
            className="flex-1 text-sm tracking-[0.06em]"
            style={{
              fontWeight: isUncategorized ? 400 : 600,
              color: isUncategorized ? 'var(--text-muted)' : accentColor,
            }}
          >
            {label}
          </span>
        )}

        {/* 並び替え矢印 — ユーザー作成グループのみ、ホバー時表示 */}
        {!isUncategorized && group && !labelEditor.isEditing && (onMoveUp || onMoveDown) && (
          <span
            className="flex items-center gap-px"
            style={{ opacity: headerHovered ? 0.8 : 0, transition: 'opacity 0.15s' }}
          >
            <button
              disabled={!onMoveUp}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              aria-label={`${group.label}を上に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveUp ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveUp) e.currentTarget.style.color = accentColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowUp size={14} />
            </button>
            <button
              disabled={!onMoveDown}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              aria-label={`${group.label}を下に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveDown ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveDown) e.currentTarget.style.color = accentColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowDown size={14} />
            </button>
          </span>
        )}

        {/* 編集ボタン — ユーザー作成グループのみ、ホバー時表示 */}
        {!isUncategorized && group && onUpdate && !labelEditor.isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              labelEditor.startEditing();
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
            <SquarePen size={14} />
          </button>
        )}

        {/* 削除ボタン — ユーザー作成グループのみ、ホバー時表示 */}
        {!isUncategorized && group && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteConfirm.requestDelete();
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
            <X size={14} />
          </button>
        )}
      </div>

      {/* エントリリスト */}
      {!collapsed && (
        entries.length > 0 ? (
          <SortableEntryList
            entries={entries}
            onReorder={onReorderEntries}
          />
        ) : !isUncategorized ? (
          <div className="py-3.5 px-3 text-sm text-text-faint text-center">
            メモを追加してください
          </div>
        ) : null
      )}

      {/* 削除確認モーダル */}
      {group && onRemove && (
        <ConfirmModal
          open={deleteConfirm.isModalOpen}
          onClose={deleteConfirm.closeModal}
          title={`「${group.label}」を削除`}
          confirmationLabel={`未分類へメモが ${entries.length}件 移動することを理解しました`}
          actions={[
            {
              label: '削除',
              color: 'var(--danger)',
              requiresConfirmation: true,
              onClick: deleteConfirm.executeDelete,
            },
          ]}
        />
      )}
    </div>
  );
}
