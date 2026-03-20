import { useRef } from 'react';

import { selectEntriesByPanel } from '../../store';
import { useStore } from '../../store';
import { EntryCard } from '../entries/EntryCard';
import { EntryInput } from '../entries/EntryInput';

export function FreeMemoPanel() {
  const entries = useStore(selectEntriesByPanel('free'));
  const scrollRef = useRef<HTMLDivElement>(null);

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
