import { GroupHeader } from '@/components/common/groupHeader';
import { SortableEntryColumn } from '@/components/entries/dnd/sortableEntryColumn';
import { ChevronDown } from '@/components/icons';
import { useT } from '@/i18n';
import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { memoContainerId } from '@/lib/entryDnd';
import { useStore } from '@/store';
import type { MemoEntry, MemoGroup } from '@/types/memo';

interface MemoGroupSectionProps {
  group: MemoGroup | null; // null = 未分類
  panel: 'free' | 'personal';
  entries: MemoEntry[];
  accentColor: string;
  onToggleCollapse?: (id: string) => void;
  onRemove?: (id: string) => Promise<void>;
  onUpdate?: (id: string, patch: Partial<Pick<MemoGroup, 'label' | 'collapsed'>>) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** フィルター適用中など、並び替えを無効化したいとき true */
  dndDisabled?: boolean;
}

export function MemoGroupSection({
  group,
  entries,
  accentColor,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
  panel,
  dndDisabled,
}: MemoGroupSectionProps) {
  const t = useT();
  const isUncategorized = group === null;

  const uncategorizedCollapsed = useStore((s) => s.uncategorizedCollapsed[panel] ?? false);
  const setUncategorizedCollapsed = useStore((s) => s.setUncategorizedCollapsed);
  const collapsed = isUncategorized ? uncategorizedCollapsed : (group?.collapsed ?? false);

  const labelEditor = useGroupLabelEditor({
    initialLabel: group?.label ?? '',
    onSave: (newLabel) => {
      if (group && onUpdate) onUpdate(group.id, { label: newLabel });
    },
    toastMessage: t('panels.groupRenamed'),
  });

  const deleteConfirm = useDeleteWithConfirmation(
    entries.length > 0,
    () => {
      if (group && onRemove) return onRemove(group.id);
    },
    t('panels.groupDeleted'),
  );

  return (
    <div>
      {isUncategorized ? (
        // 未分類ヘッダー（簡易版）
        <div
          onClick={() => setUncategorizedCollapsed(panel, !uncategorizedCollapsed)}
          className="flex cursor-pointer items-center gap-2 px-2.5 py-[7px] select-none"
          style={{
            background: 'color-mix(in srgb, var(--text-muted) 5%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--text-muted) 10%, transparent)',
          }}
        >
          <span
            className="flex shrink-0 items-center transition-transform duration-150"
            style={{
              color: 'var(--text-muted)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDown size={12} />
          </span>
          <span className="flex-1 text-sm tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
            {t('common.uncategorized')}
          </span>
        </div>
      ) : (
        // ユーザー作成グループヘッダー
        <GroupHeader
          label={group.label}
          collapsed={group.collapsed}
          accentColor={accentColor}
          onToggle={() => onToggleCollapse?.(group.id)}
          labelEditor={labelEditor}
          deleteConfirm={deleteConfirm}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          deleteModal={{
            title: t('panels.deleteGroupTitle', {
              label: t('common.quoted', { label: group.label }),
            }),
            confirmationLabel: t('panels.deleteGroupConfirmMemo', { n: entries.length }),
          }}
        />
      )}

      {/* エントリリスト — コンテナ跨ぎ DnD のドロップ先（空グループも droppable） */}
      {!collapsed && (entries.length > 0 || !isUncategorized) && (
        <SortableEntryColumn
          containerId={memoContainerId(panel, group?.id)}
          entries={entries}
          disabled={dndDisabled}
          emptyPlaceholder={
            !isUncategorized ? (
              <div className="text-text-faint px-3 py-3.5 text-center text-sm">
                {t('panels.addMemoPrompt')}
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
