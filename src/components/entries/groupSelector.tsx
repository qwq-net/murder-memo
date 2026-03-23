import { useCallback, useMemo, useState } from 'react';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';
import { Plus } from '@/components/icons';

interface GroupSelectorProps {
  panel: PanelId;
}

/**
 * エントリ入力フォームのグループセレクタ行。
 * グループ選択 + 新規グループ追加 UI を提供する。
 */
export function GroupSelector({ panel }: GroupSelectorProps) {
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const addToast = useStore((s) => s.addToast);

  const [selectedGroupId, persistGroupId] = useLocalStorage(`murder-memo-selected-group-${panel}`, '');
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  // selectedGroupId が現存するグループに含まれなければリセット
  const validSelectedId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId = isTimeline && timelineGroups.length === 1 && !validSelectedId
    ? timelineGroups[0].id
    : validSelectedId;

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    if (isTimeline) {
      const group = await addTimelineGroup(label);
      persistGroupId(group.id);
    } else if (isMemoPanel) {
      const group = await addMemoGroup(label, panel as 'free' | 'personal');
      persistGroupId(group.id);
    }
    addToast('グループを追加しました');
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, isTimeline, isMemoPanel, panel, addTimelineGroup, addMemoGroup, persistGroupId, addToast]);

  return (
    <div className="flex gap-1 items-center min-h-6">
      {/* グループセレクタ */}
      <select
        value={effectiveGroupId}
        onChange={(e) => persistGroupId(e.target.value)}
        aria-label="追加先メモグループ"
        className="flex-1 bg-bg-elevated border border-border-subtle rounded-sm text-text-secondary text-sm px-1.5 py-[3px] outline-none"
      >
        {isTimeline ? (
          <>
            <option value="">{groups.length === 0 ? 'メモグループなし' : 'メモグループを選択…'}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        ) : (
          <>
            <option value="">未分類</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        )}
      </select>

      {/* グループ追加 */}
      {isAddingGroup ? (
        <div className="flex gap-1 items-center">
          <input
            autoFocus
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddGroup();
              if (e.key === 'Escape') {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            onBlur={() => {
              if (!newGroupLabel.trim()) {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            placeholder={isTimeline ? '当日、前日 等' : 'メモグループ名'}
            aria-label="メモグループ名"
            className="flex-1 min-w-[60px] bg-bg-base border border-border-default rounded-sm text-text-primary text-sm px-1.5 py-[3px] outline-none"
          />
          <button
            onClick={handleAddGroup}
            className="btn-primary btn-sm text-sm"
          >
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          title="メモグループを追加"
          className="flex items-center bg-transparent border border-dashed border-border-default rounded-sm text-text-muted text-sm px-2 py-[3px] cursor-pointer transition-[border-color,color] duration-150 whitespace-nowrap hover:border-border-strong hover:text-text-secondary"
        >
          <Plus size={12} strokeWidth={2.5} className="mr-1" />
          メモグループ
        </button>
      )}
    </div>
  );
}

/**
 * 現在選択中のグループ ID を取得するフック。
 * entryInput の submit ロジックが参照するため、同じ localStorage キーを使う。
 */
export function useSelectedGroupId(panel: PanelId) {
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const [selectedGroupId] = useLocalStorage(`murder-memo-selected-group-${panel}`, '');

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  const validSelectedId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId = isTimeline && timelineGroups.length === 1 && !validSelectedId
    ? timelineGroups[0].id
    : validSelectedId;

  return effectiveGroupId;
}
