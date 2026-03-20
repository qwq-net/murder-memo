import { useCallback, useRef, useState } from 'react';

import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';

interface EntryInputProps {
  panel: PanelId;
}

export function EntryInput({ panel }: EntryInputProps) {
  const addEntry = useStore((s) => s.addEntry);
  const setFocusedEntry = useStore((s) => s.setFocusedEntry);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(async () => {
    const text = value.trim();
    if (!text) return;

    const defaultType = panel === 'timeline' ? 'timeline' as const : 'text' as const;
    const entry = await addEntry({ content: text, panel, type: defaultType });
    setValue('');
    setFocusedEntry(entry.id);

    // 入力欄にフォーカスを戻す（次のメモをすぐ書けるように）
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [value, panel, addEntry, setFocusedEntry]);

  return (
    <div
      style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="メモを入力… Enter で追加"
        rows={1}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          lineHeight: 1.5,
          padding: '6px 10px',
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border-default)';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border-subtle)';
        }}
      />
    </div>
  );
}
