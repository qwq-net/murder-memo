/**
 * 自由メモ / 自分用メモ の共通パネルコンポーネント。
 * FreeMemoPanel と PersonalMemoPanel で90%同一だったロジックを統合。
 */
import { useMemo } from 'react';

import { EmptyState } from '@/components/common/emptyState';
import { PanelDndBoundary } from '@/components/entries/dnd/entriesDndContext';
import { EntryInput } from '@/components/entries/entryInput';
import { MemoGroupSection } from '@/components/panels/memoGroupSection';
import { useGroupSwap } from '@/hooks/useGroupSwap';
import { filterEntries, isFilterActive, resolveCharacterNames } from '@/lib/entryFilter';
import { groupEntriesByMemoGroup } from '@/lib/grouping';
import { useStore } from '@/store';

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
  const reorderMemoGroups = useStore((s) => s.reorderMemoGroups);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const filterIds = useStore((s) => s.characterFilter[panel]);
  const importanceLevels = useStore((s) => s.importanceFilter[panel]);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups, panel],
  );

  // フィルター対象キャラクターの名前リスト（テキスト中の名前でも一致させるため）
  const filterCharNames = useMemo(
    () => resolveCharacterNames(allCharacters, filterIds),
    [allCharacters, filterIds],
  );

  const criteria = useMemo(
    () => ({ characterIds: filterIds, characterNames: filterCharNames, importanceLevels }),
    [filterIds, filterCharNames, importanceLevels],
  );

  const entries = useMemo(() => {
    const result = filterEntries(
      allEntries.filter((e) => e.panel === panel),
      criteria,
    );
    return [...result].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allEntries, panel, criteria]);

  const groupedData = useMemo(
    () => groupEntriesByMemoGroup(entries, panelGroups),
    [entries, panelGroups],
  );

  const swapGroup = useGroupSwap(panelGroups, reorderMemoGroups);

  const hasGroups = panelGroups.length > 0;
  const isFiltering = isFilterActive(criteria);
  const isEmpty = entries.length === 0 && !hasGroups && !isFiltering;

  const entryInput = <EntryInput panel={panel} />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-[60px]">
        {isFiltering && entries.length === 0 ? (
          <div className="text-text-faint px-5 py-6 text-center text-sm">
            フィルター条件に一致するメモはありません
          </div>
        ) : isEmpty ? (
          <EmptyState
            accentColor={accentColor}
            message={emptyMessage}
            onAddGroup={async (label) => {
              await addMemoGroup(label, panel);
              addToast('グループを追加しました');
            }}
          />
        ) : (
          <PanelDndBoundary>
            {hasGroups ? (
              <>
                {groupedData.uncategorized.length > 0 && (
                  <MemoGroupSection
                    group={null}
                    panel={panel}
                    entries={groupedData.uncategorized}
                    accentColor={accentColor}
                    dndDisabled={isFiltering}
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
                    onMoveUp={i > 0 ? () => swapGroup(i, -1) : undefined}
                    onMoveDown={i < panelGroups.length - 1 ? () => swapGroup(i, 1) : undefined}
                    dndDisabled={isFiltering}
                  />
                ))}
              </>
            ) : (
              <MemoGroupSection
                group={null}
                panel={panel}
                entries={entries}
                accentColor={accentColor}
                dndDisabled={isFiltering}
              />
            )}
          </PanelDndBoundary>
        )}
      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
