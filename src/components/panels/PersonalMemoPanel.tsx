import { useMemo } from 'react';

import { useStore } from '../../store';
import { EntryInput } from '../entries/EntryInput';
import { MemoGroupSection } from './MemoGroupSection';

export function PersonalMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const memoGroups = useStore((s) => s.memoGroups);
  const toggleMemoGroupCollapse = useStore((s) => s.toggleMemoGroupCollapse);
  const removeMemoGroup = useStore((s) => s.removeMemoGroup);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const inputPosition = useStore((s) => s.settings.inputPosition);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === 'personal').sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups],
  );

  const entries = useMemo(
    () => allEntries.filter((e) => e.panel === 'personal').sort((a, b) => a.sortOrder - b.sortOrder),
    [allEntries],
  );

  const groupedData = useMemo(() => {
    const grouped = panelGroups.map((group) => ({
      group,
      entries: entries.filter((e) => e.groupId === group.id),
    }));
    const uncategorized = entries.filter(
      (e) => !e.groupId || !panelGroups.some((g) => g.id === e.groupId),
    );
    return { grouped, uncategorized };
  }, [panelGroups, entries]);

  const accentColor = 'var(--panel-personal-accent)';
  const hasGroups = panelGroups.length > 0;
  const isEmpty = entries.length === 0 && !hasGroups;

  const entryInput = <EntryInput panel="personal" />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isEmpty ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>
            ハンドアウトや個人情報をメモ
          </div>
        ) : hasGroups ? (
          <>
            {groupedData.uncategorized.length > 0 && (
              <MemoGroupSection
                group={null}
                entries={groupedData.uncategorized}
                accentColor={accentColor}
                onReorderEntries={(ids) => reorderEntries('personal', ids)}
              />
            )}
            {groupedData.grouped.map(({ group, entries: groupEntries }) => (
              <MemoGroupSection
                key={group.id}
                group={group}
                entries={groupEntries}
                accentColor={accentColor}
                onToggleCollapse={toggleMemoGroupCollapse}
                onRemove={removeMemoGroup}
                onUpdate={updateMemoGroup}
                onReorderEntries={(ids) => reorderEntries('personal', ids)}
              />
            ))}
          </>
        ) : (
          <MemoGroupSection
            group={null}
            entries={entries}
            accentColor={accentColor}
            onReorderEntries={(ids) => reorderEntries('personal', ids)}
          />
        )}
      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
