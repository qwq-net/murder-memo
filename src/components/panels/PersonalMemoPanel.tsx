import { useMemo } from 'react';

import { useStore } from '../../store';
import { EntryInput } from '../entries/EntryInput';
import { SortableEntryList } from '../entries/SortableEntryList';

export function PersonalMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => e.panel === 'personal')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [allEntries],
  );

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
            }}
          >
            ハンドアウトや個人情報をメモ
          </div>
        ) : (
          <SortableEntryList
            entries={entries}
            onReorder={(ids) => reorderEntries('personal', ids)}
          />
        )}
      </div>
      <EntryInput panel="personal" />
    </>
  );
}
