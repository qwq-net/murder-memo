import { useDndContext } from '@dnd-kit/core';

import { GroupHeader } from '@/components/common/groupHeader';
import { SortableEntryColumn } from '@/components/entries/dnd/sortableEntryColumn';
import { HourDividerView } from '@/components/panels/hourDividerView';
import { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { timelineHourContainerId, timelineUnknownContainerId } from '@/lib/entryDnd';
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
  onMoveUp,
  onMoveDown,
  dndDisabled,
}: TimelineGroupSectionProps) {
  const entryCount =
    hourGroups.reduce((sum, hg) => sum + hg.entries.length, 0) + unknownEntries.length;

  // ドラッグ中は「不明（時刻なし）」へのドロップ先を常時表示する（既存の不明エントリが無くても、
  // 時刻をクリアして取り込めるように）。非ドラッグ時は不明エントリがある場合のみ表示する。
  const { active } = useDndContext();
  const isDragging = active != null && !dndDisabled;
  const showUnknownZone = unknownEntries.length > 0 || isDragging;

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
            {/* 時間帯グループ — 時間帯（時単位）ごとに 1 つの droppable 列。別の時間帯へドロップ
                すると隣接エントリの時刻を継承する（並び替え単位は時間帯全体）。連続する同時刻の
                時刻ラベルは hideTimeDuplicates で省略表示する。 */}
            {hourGroups.map((hg) => (
              <div key={hg.hour}>
                <HourDividerView label={hg.label} />
                <SortableEntryColumn
                  containerId={timelineHourContainerId(group.id, hg.hour)}
                  entries={hg.entries}
                  hideTimeDuplicates
                  disabled={dndDisabled}
                />
              </div>
            ))}

            {/* 不明グループ — 時刻なし。ドロップすると時刻がクリアされる。
                ドラッグ中は不明エントリが無くてもドロップ先として表示する。 */}
            {showUnknownZone && (
              <div>
                <HourDividerView label="不明" muted />
                <SortableEntryColumn
                  containerId={timelineUnknownContainerId(group.id)}
                  entries={unknownEntries}
                  disabled={dndDisabled}
                  emptyPlaceholder={
                    <div className="text-text-faint px-3 py-3 text-center text-xs">
                      ここへドロップで時刻なし
                    </div>
                  }
                />
              </div>
            )}

            {/* 完全に空 & 非ドラッグ時のみ案内を出す（ドラッグ中は上の不明ゾーンが受け皿になる） */}
            {hourGroups.length === 0 && unknownEntries.length === 0 && !isDragging && (
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
