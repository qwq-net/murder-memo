import { useCallback, useMemo } from 'react';

import { GroupSelectorView } from '@/components/entries/groupSelectorView';
import { memoGroupsForPanel } from '@/lib/grouping';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';

interface GroupSelectorProps {
  panel: PanelId;
  /** 現在選択中のグループID（親が管理） */
  selectedGroupId: string;
  /** グループIDが変更されたときのコールバック */
  onGroupIdChange: (id: string) => void;
}

/**
 * エントリ入力フォームのグループセレクタ（store 連携版）。
 *
 * - store からグループ一覧 / 追加関数を取得し、`GroupSelectorView` に渡す
 * - 既存の controlled component 仕様は維持（選択状態は親 `EntryInput` が管理）
 */
export function GroupSelector({ panel, selectedGroupId, onGroupIdChange }: GroupSelectorProps) {
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const addToast = useStore((s) => s.addToast);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroupsForPanel(memoGroups, panel);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  // selectedGroupId が現存するグループに含まれなければリセット
  const validSelectedId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId =
    isTimeline && timelineGroups.length === 1 && !validSelectedId
      ? timelineGroups[0].id
      : validSelectedId;

  const handleAddGroup = useCallback(
    async (label: string) => {
      if (isTimeline) {
        const group = await addTimelineGroup(label);
        onGroupIdChange(group.id);
      } else if (isMemoPanel) {
        const group = await addMemoGroup(label, panel as 'free' | 'personal');
        onGroupIdChange(group.id);
      }
      addToast('グループを追加しました');
    },
    [isTimeline, isMemoPanel, panel, addTimelineGroup, addMemoGroup, onGroupIdChange, addToast],
  );

  return (
    <GroupSelectorView
      isTimeline={isTimeline}
      groups={groups.map((g) => ({ id: g.id, label: g.label }))}
      selectedGroupId={effectiveGroupId}
      onGroupIdChange={onGroupIdChange}
      onAddGroup={handleAddGroup}
    />
  );
}
