import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { useCaretPosition } from '../../hooks/useCaretPosition';
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
  const cancelledRef = useRef(false);
  const { applyPendingCursor, captureFromMouseEvent } = useCaretPosition();
  const { resize } = useAutoResizeTextarea();

  useLayoutEffect(() => {
    if (!isEditing || !inputRef.current) return;
    cancelledRef.current = false;
    const el = inputRef.current;
    resize(el);
    el.focus();
    applyPendingCursor(el);
  }, [isEditing, resize, applyPendingCursor]);

  useEffect(() => {
    if (!isEditing) setDraft(entry.content);
  }, [entry.content, isEditing]);

  // onBlurから呼ばれる唯一の保存ポイント
  const handleBlur = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setFocusedEntry(null);
      return;
    }
    if (draft.trim() !== entry.content) {
      updateEntry(entry.id, { content: draft.trim() });
    }
    setFocusedEntry(null);
  }, [draft, entry.id, entry.content, updateEntry, setFocusedEntry]);

  if (isEditing) {
    return (
      <div style={{ padding: '1px 10px 2px' }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            resize(e.target);
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // blurに委譲して保存（二重実行を防止）
              inputRef.current?.blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelledRef.current = true;
              setDraft(entry.content);
              inputRef.current?.blur();
            }
            if (e.key === 'Tab') {
              // Tab でフォーカスが他の要素に移動するのを防止
              e.preventDefault();
            }
          }}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.6,
            padding: 0,
            margin: 0,
            resize: 'none',
            overflow: 'hidden',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      onMouseUp={(e) => {
        if (e.shiftKey) return;
        captureFromMouseEvent(e, entry.content.length);
        setFocusedEntry(entry.id);
      }}
      style={{
        cursor: 'text',
        padding: '1px 4px 2px 10px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: 22,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {entry.content || (
        <span style={{ color: 'var(--text-faint)' }}>空のメモ</span>
      )}
    </div>
  );
}
