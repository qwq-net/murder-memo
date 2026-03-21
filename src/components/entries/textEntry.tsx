import { useCallback } from 'react';

import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';
import { EntryContent } from '@/components/entries/entryContent';

interface TextEntryProps {
  entry: MemoEntry;
  isHovered: boolean;
}

export function TextEntry({ entry, isHovered }: TextEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);

  const handleSave = useCallback(
    (content: string) => {
      if (content !== entry.content) updateEntry(entry.id, { content });
    },
    [entry.id, entry.content, updateEntry],
  );

  return <EntryContent entry={entry} onSave={handleSave} isHovered={isHovered} />;
}
