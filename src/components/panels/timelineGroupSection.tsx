import { GroupHeader } from '@/components/common/groupHeader';
import { SortableEntryList } from '@/components/entries/sortableEntryList';
import { HourDividerView } from '@/components/panels/hourDividerView';
import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { clusterByEventTime } from '@/lib/grouping';
import type { MemoEntry, TimelineGroup } from '@/types/memo';

// ─── グループセクション ──────────────────────────────────────────────────────

export interface TimelineGroupSectionProps {
  group: TimelineGroup;
  hourGroups: { hour: number; label: string; entries: MemoEntry[] }[];
  unknownEntries: MemoEntry[];
  onToggleCollapse: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
  onUpdate: (
    id: string,
    patch: Partial<Pick<TimelineGroup, 'label' | 'collapsed'>>,
  ) => Promise<void>;
  onReorderEntries: (orderedIds: string[]) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** フィルター適用中など、並び替えを無効化したいとき true */
  dndDisabled?: boolean;
}

export function TimelineGroupSection({
  group,
  hourGroups,
  unknownEntries,
  onToggleCollapse,
  onRemove,
  onUpdate,
  onReorderEntries,
  onMoveUp,
  onMoveDown,
  dndDisabled,
}: TimelineGroupSectionProps) {
  const entryCount =
    hourGroups.reduce((sum, hg) => sum + hg.entries.length, 0) + unknownEntries.length;

  const labelEditor = useGroupLabelEditor({
    initialLabel: group.label,
    onSave: (newLabel) => onUpdate(group.id, { label: newLabel }),
    toastMessage: 'グループ名を変更しました',
  });

  const deleteConfirm = useDeleteWithConfirmation(
    entryCount > 0,
    () => onRemove(group.id),
    'グループを削除しました',
  );

  return (
    <div>
      <GroupHeader
        label={group.label}
        collapsed={group.collapsed}
        accentColor="var(--panel-timeline-accent)"
        onToggle={() => onToggleCollapse(group.id)}
        labelEditor={labelEditor}
        deleteConfirm={deleteConfirm}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        deleteModal={{
          title: `「${group.label}」を削除`,
          confirmationLabel: `メモが ${entryCount}件 一緒に削除されることを理解しました`,
        }}
      />

      {/* グループ内容 */}
      {!group.collapsed && (
        // --tl-spine-x: 縦線・ドットの中心X座標の単一の真実の情報源
        // 縦線・HourDividerドットはともにこの値から位置を計算するため、値を変えれば両方追従する
        <div className="relative py-2.5" style={{ '--tl-spine-x': '14px' } as React.CSSProperties}>
          {/* 縦線 — width:1px + translateX(-50%) で中心を --tl-spine-x に合わせる */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: 'var(--tl-spine-x)', width: 1, transform: 'translateX(-50%)' }}
          >
            {/* 上部破線 */}
            <div
              className="absolute top-0 h-2.5 w-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent) 0 2px, transparent 2px 4px)',
              }}
            />
            {/* 中央実線 */}
            <div
              className="absolute top-2.5 bottom-2.5 w-full"
              style={{
                background: 'color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)',
              }}
            />
            {/* 下部破線 */}
            <div
              className="absolute bottom-0 h-2.5 w-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--panel-timeline-accent) 12%, transparent) 0 2px, transparent 2px 4px)',
              }}
            />
          </div>

          <div className="pl-1.5">
            {/* 時間帯グループ — 並び替えは「同一時刻のエントリ間のみ」に制限する。
                異なる時刻のエントリは時刻ソートで並びが戻るため、同時刻クラスタごとに
                別の並び替え単位（SortableEntryList）に分割して異時刻ドラッグを成立させない。 */}
            {hourGroups.map((hg) => (
              <div key={hg.hour}>
                <HourDividerView label={hg.label} />
                {clusterByEventTime(hg.entries).map((cluster) => (
                  <SortableEntryList
                    key={cluster[0].id}
                    entries={cluster}
                    onReorder={onReorderEntries}
                    hideTimeDuplicates
                    disabled={dndDisabled}
                  />
                ))}
              </div>
            ))}

            {/* 不明グループ — DnDで並び替え可能 */}
            {unknownEntries.length > 0 && (
              <div>
                <HourDividerView label="不明" />
                <SortableEntryList
                  entries={unknownEntries}
                  onReorder={onReorderEntries}
                  disabled={dndDisabled}
                />
              </div>
            )}

            {/* 空の場合 */}
            {hourGroups.length === 0 && unknownEntries.length === 0 && (
              <div className="text-text-faint px-3 py-3.5 text-center text-sm">
                メモを追加してください
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 時間帯の区切りライン ―――― 9:00 ―――――――― */
