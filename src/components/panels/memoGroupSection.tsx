import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { useStore } from '@/store';
import type { MemoEntry, MemoGroup, PanelId } from '@/types/memo';
import { GroupHeader } from '@/components/common/groupHeader';
import { SortableEntryList } from '@/components/entries/sortableEntryList';
import { ChevronDown } from '@/components/icons';

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

  const uncategorizedCollapsed = useStore((s) => s.uncategorizedCollapsed[panel] ?? false);
  const setUncategorizedCollapsed = useStore((s) => s.setUncategorizedCollapsed);
  const collapsed = isUncategorized ? uncategorizedCollapsed : (group?.collapsed ?? false);

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

  return (
    <div>
      {isUncategorized ? (
        // 未分類ヘッダー（簡易版）
        <div
          onClick={() => setUncategorizedCollapsed(panel, !uncategorizedCollapsed)}
          className="flex items-center gap-2 px-2.5 py-[7px] cursor-pointer select-none"
          style={{
            background: 'color-mix(in srgb, var(--text-muted) 5%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--text-muted) 10%, transparent)',
          }}
        >
          <span
            className="flex items-center shrink-0 transition-transform duration-150"
            style={{
              color: 'var(--text-muted)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDown size={12} />
          </span>
          <span className="flex-1 text-sm tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
            未分類
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
            title: `「${group.label}」を削除`,
            confirmationLabel: `未分類へメモが ${entries.length}件 移動することを理解しました`,
          }}
        />
      )}

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
    </div>
  );
}
