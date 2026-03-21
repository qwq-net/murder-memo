import { useCallback, useEffect, useMemo, useRef } from 'react';
import { nanoid } from 'nanoid';

import { putImage } from '../../lib/idb';
import { useStore } from '../../store';
import { EntryInput } from '../entries/EntryInput';
import { MemoGroupSection } from './MemoGroupSection';

export function FreeMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const memoGroups = useStore((s) => s.memoGroups);
  const toggleMemoGroupCollapse = useStore((s) => s.toggleMemoGroupCollapse);
  const removeMemoGroup = useStore((s) => s.removeMemoGroup);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const addEntry = useStore((s) => s.addEntry);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const scrollRef = useRef<HTMLDivElement>(null);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === 'free').sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups],
  );

  const entries = useMemo(
    () => allEntries.filter((e) => e.panel === 'free').sort((a, b) => a.sortOrder - b.sortOrder),
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

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        const blobKey = nanoid();
        await putImage(blobKey, blob);
        await addEntry({ content: '', panel: 'free', type: 'image', imageBlobKey: blobKey });
        break;
      }
    },
    [addEntry],
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const accentColor = 'var(--panel-free-accent)';
  const hasGroups = panelGroups.length > 0;
  const isEmpty = entries.length === 0 && !hasGroups;

  const entryInput = <EntryInput panel="free" />;

  return (
    <>
      {inputPosition === 'top' && entryInput}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        {isEmpty ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>
            メモを書き殴ろう
          </div>
        ) : hasGroups ? (
          <>
            {groupedData.uncategorized.length > 0 && (
              <MemoGroupSection
                group={null}
                entries={groupedData.uncategorized}
                accentColor={accentColor}
                onReorderEntries={(ids) => reorderEntries('free', ids)}
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
                onReorderEntries={(ids) => reorderEntries('free', ids)}
              />
            ))}
          </>
        ) : (
          <MemoGroupSection
            group={null}
            entries={entries}
            accentColor={accentColor}
            onReorderEntries={(ids) => reorderEntries('free', ids)}
          />
        )}
      </div>
      {inputPosition === 'bottom' && entryInput}
    </>
  );
}
