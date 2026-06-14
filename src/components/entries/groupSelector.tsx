import { useCallback, useMemo } from 'react';

import { GroupSelectorView } from '@/components/entries/groupSelectorView';
import { resolveGroupSelection } from '@/lib/groupSelection';
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

  // グループ候補と有効選択の解決は entryInput と共通の純関数に集約
  const { candidates, effectiveGroupId } = useMemo(
    () => resolveGroupSelection(panel, { timelineGroups, memoGroups }, selectedGroupId),
    [panel, timelineGroups, memoGroups, selectedGroupId],
  );

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
      groups={candidates}
      selectedGroupId={effectiveGroupId}
      onGroupIdChange={onGroupIdChange}
      onAddGroup={handleAddGroup}
    />
  );
}
