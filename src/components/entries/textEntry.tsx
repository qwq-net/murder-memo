import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useCaretPosition } from '@/hooks/useCaretPosition';
import { useStore } from '@/store';
import type { MemoEntry } from '@/types/memo';

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
  const blurHandledRef = useRef(false);
  const { applyPendingCursor, captureFromMouseEvent } = useCaretPosition();
  const { resize } = useAutoResizeTextarea();

  // 編集モードに入った瞬間だけ focus + カーソル復元を行う（毎レンダーでは実行しない）
  const editInitRef = useRef(false);
  useLayoutEffect(() => {
    if (!isEditing) {
      editInitRef.current = false;
      return;
    }
    if (editInitRef.current || !inputRef.current) return;
    editInitRef.current = true;
    cancelledRef.current = false;
    blurHandledRef.current = false;
    const el = inputRef.current;
    resize(el);
    el.focus();
    applyPendingCursor(el);
  }, [isEditing, resize, applyPendingCursor]);

  const [prevSyncKey, setPrevSyncKey] = useState({ content: entry.content, isEditing });
  if (entry.content !== prevSyncKey.content || isEditing !== prevSyncKey.isEditing) {
    setPrevSyncKey({ content: entry.content, isEditing });
    if (!isEditing) setDraft(entry.content);
  }

  // onBlurから呼ばれる唯一の保存ポイント（二重実行防止付き）
  const handleBlur = useCallback(() => {

    if (blurHandledRef.current) return;
    blurHandledRef.current = true;
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
      <div className="px-2.5 pt-px pb-0.5">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            resize(e.target);
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // 編集中のキーイベントが dnd-kit の KeyboardSensor に到達するのを防止
            e.stopPropagation();

            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
              e.preventDefault();
            }
          }}
          rows={1}
          className="w-full bg-transparent border-none outline-none text-text-primary font-sans text-[13px] leading-[1.2] p-0 m-0 resize-none overflow-hidden block"
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
      className="cursor-text pt-px pr-1 pb-0.5 pl-2.5 whitespace-pre-wrap break-words min-h-[22px] text-[13px] leading-[1.2]"
    >
      {entry.content || (
        <span className="text-text-faint">空のメモ</span>
      )}
    </div>
  );
}
