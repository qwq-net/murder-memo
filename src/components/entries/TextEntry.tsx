import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useStore } from '../../store';
import type { MemoEntry } from '../../types/memo';

interface TextEntryProps {
  entry: MemoEntry;
}

function getCaretOffset(x: number, y: number): number | null {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? r.startOffset : null;
  }
  const cp = (document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offset: number } | null;
  }).caretPositionFromPoint?.(x, y);
  return cp ? cp.offset : null;
}

export function TextEntry({ entry }: TextEntryProps) {
  const updateEntry = useStore((s) => s.updateEntry);
  const focusedEntryId = useStore((s) => s.focusedEntryId);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);

  const isEditing = focusedEntryId === entry.id;
  const [draft, setDraft] = useState(entry.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const cancelledRef = useRef(false);

  const resizeTextarea = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useLayoutEffect(() => {
    if (!isEditing || !inputRef.current) return;
    cancelledRef.current = false;
    const el = inputRef.current;
    resizeTextarea(el);
    el.focus();

    if (pendingSelectionRef.current !== null) {
      const { start, end } = pendingSelectionRef.current;
      el.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    } else if (pendingCursorRef.current !== null) {
      const pos = pendingCursorRef.current;
      el.setSelectionRange(pos, pos);
      pendingCursorRef.current = null;
    } else {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing, resizeTextarea]);

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
            resizeTextarea(e.target);
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
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          pendingSelectionRef.current = { start: range.startOffset, end: range.endOffset };
          pendingCursorRef.current = null;
        } else {
          pendingCursorRef.current = getCaretOffset(e.clientX, e.clientY) ?? entry.content.length;
          pendingSelectionRef.current = null;
        }
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
