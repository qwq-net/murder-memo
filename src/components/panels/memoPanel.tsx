/**
 * 自由メモ / 自分用メモ の共通パネルコンポーネント。
 * FreeMemoPanel と PersonalMemoPanel で90%同一だったロジックを統合。
 */
import { useCallback, useMemo } from 'react';

import { useGroupSwap } from '@/hooks/useGroupSwap';
import { groupEntriesByMemoGroup } from '@/lib/grouping';
import { useStore } from '@/store';
import { EmptyState } from '@/components/common/emptyState';
import { EntryInput } from '@/components/entries/entryInput';
import { MemoGroupSection } from '@/components/panels/memoGroupSection';

interface MemoPanelProps {
  panel: 'free' | 'personal';
  accentColor: string;
  emptyMessage: string;
}

export function MemoPanel({ panel, accentColor, emptyMessage }: MemoPanelProps) {
  const allEntries = useStore((s) => s.entries);
  const allCharacters = useStore((s) => s.characters);
  const memoGroups = useStore((s) => s.memoGroups);
  const toggleMemoGroupCollapse = useStore((s) => s.toggleMemoGroupCollapse);
  const removeMemoGroup = useStore((s) => s.removeMemoGroup);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const addToast = useStore((s) => s.addToast);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const reorderMemoGroups = useStore((s) => s.reorderMemoGroups);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const filterIds = useStore((s) => s.characterFilter[panel]);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups, panel],
  );

  // フィルター対象キャラクターの名前リスト（テキスト中の名前でも一致させるため）
  const filterCharNames = useMemo(
    () => allCharacters
      .filter((c) => filterIds.includes(c.id) && c.name.length > 0)
      .map((c) => c.name),
    [allCharacters, filterIds],
  );

  const entries = useMemo(() => {
    let result = allEntries.filter((e) => e.panel === panel);
    if (filterIds.length > 0) {
      // characterTags による手動タグ、またはテキスト中にキャラ名が含まれるエントリを対象とする
      result = result.filter(
        (e) =>
          filterIds.some((id) => e.characterTags.includes(id)) ||
          filterCharNames.some((name) => e.content.includes(name)),
      );
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allEntries, panel, filterIds, filterCharNames]);

  const groupedData = useMemo(
    () => groupEntriesByMemoGroup(entries, panelGroups),
    [entries, panelGroups],
  );

  const handleReorder = useCallback(
    (ids: string[]) => reorderEntries(panel, ids),
    [reorderEntries, panel],
  );

  const swapGroup = useGroupSwap(panelGroups, reorderMemoGroups);

  const hasGroups = panelGroups.length > 0;
  const isFiltering = filterIds.length > 0;
  const isEmpty = entries.length === 0 && !hasGroups && !isFiltering;

  const entryInput = <EntryInput panel={panel} />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[60px]">
        {isFiltering && entries.length === 0 ? (
          <div className="py-6 px-5 text-center text-sm text-text-faint">
            フィルター条件に一致するメモはありません
          </div>
        ) : isEmpty ? (
          <EmptyState
            accentColor={accentColor}
            message={emptyMessage}
            onAddGroup={async (label) => { await addMemoGroup(label, panel); addToast('グループを追加しました'); }}
          />
        ) : hasGroups ? (
          <>
            {groupedData.uncategorized.length > 0 && (
              <MemoGroupSection
                group={null}
                panel={panel}
                entries={groupedData.uncategorized}
                accentColor={accentColor}
                onReorderEntries={handleReorder}
              />
            )}
            {groupedData.grouped.map(({ group, entries: groupEntries }, i) => (
              <MemoGroupSection
                key={group.id}
                group={group}
                panel={panel}
                entries={groupEntries}
                accentColor={accentColor}
                onToggleCollapse={toggleMemoGroupCollapse}
                onRemove={removeMemoGroup}
                onUpdate={updateMemoGroup}
                onReorderEntries={handleReorder}
                onMoveUp={i > 0 ? () => swapGroup(i, -1) : undefined}
                onMoveDown={i < panelGroups.length - 1 ? () => swapGroup(i, 1) : undefined}
              />
            ))}
          </>
        ) : (
          <MemoGroupSection
            group={null}
            panel={panel}
            entries={entries}
            accentColor={accentColor}
            onReorderEntries={handleReorder}
          />
        )}
      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
