import { useCallback, useEffect, useMemo, useRef } from 'react';
import { nanoid } from 'nanoid';

import { putImage } from '../../lib/idb';
import { useStore } from '../../store';
import { EntryCard } from '../entries/EntryCard';
import { EntryInput } from '../entries/EntryInput';

export function FreeMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const entries = useMemo(
    () => allEntries.filter((e) => e.panel === 'free').sort((a, b) => a.sortOrder - b.sortOrder),
    [allEntries],
  );
  const addEntry = useStore((s) => s.addEntry);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div
        ref={scrollRef}
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
            メモを書き殴ろう
          </div>
        ) : (
          entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
      </div>
      <EntryInput panel="free" />
    </>
  );
}
