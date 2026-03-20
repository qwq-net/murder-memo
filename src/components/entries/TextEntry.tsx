import { useCallback, useEffect, useRef, useState } from 'react';

import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';

interface TextEntryProps {
  entry: MemoEntry;
}

export function TextEntry({ entry }: TextEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);

  const isEditing = focusedEntryId === entry.id;
  const [draft, setDraft] = useState(entry.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setDraft(entry.content);
  }, [entry.content, isEditing]);

  const save = useCallback(() => {
    if (draft.trim() !== entry.content) {
      updateEntry(entry.id, { content: draft.trim() });
    }
    setFocusedEntry(null);
  }, [draft, entry.id, entry.content, updateEntry, setFocusedEntry]);

  const cancel = useCallback(() => {
    setDraft(entry.content);
    setFocusedEntry(null);
  }, [entry.content, setFocusedEntry]);

  if (isEditing) {
    return (
      <div style={{ padding: '1px 10px 2px' }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          rows={Math.max(1, draft.split('\n').length)}
          style={{
            width: '100%',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.6,
            padding: '3px 8px',
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setFocusedEntry(entry.id)}
      style={{
        cursor: 'text',
        padding: '1px 10px 2px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: 22,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {entry.content || (
        <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>空のメモ</span>
      )}
    </div>
  );
}
