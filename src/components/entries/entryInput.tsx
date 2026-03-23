import { useCallback, useEffect, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useTimeInput } from '@/hooks/useTimeInput';
import { parseEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';
import { GroupSelector, useSelectedGroupId } from '@/components/entries/groupSelector';
import { useImagePicker } from '@/components/layout/panel';

interface EntryInputProps {
  panel: PanelId;
}

export function EntryInput({ panel }: EntryInputProps) {
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const inputPosition = useStore((s) => s.settings.inputPosition);
  const addToast = useStore((s) => s.addToast);

  const [value, setValue] = useState('');
  const [textError, setTextError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const { resize: resizeInput } = useAutoResizeTextarea(120);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';
  const openImagePicker = useImagePicker();

  const timeInput = useTimeInput();
  const effectiveGroupId = useSelectedGroupId(panel);

  useEffect(() => {
    resizeInput(inputRef.current);
  }, [value, resizeInput]);

  const submit = useCallback(async () => {
    // 連打による重複送信を防止
    if (submittingRef.current) return;

    const text = value.trim();
    const timeTrimmed = timeInput.getCompleted();

    if (isTimeline) {
      if (!text && !timeTrimmed) return;
      if (timeTrimmed && !text) { setTextError(true); return; }
      if (!effectiveGroupId) return;
    } else {
      if (!text) return;
    }

    submittingRef.current = true;
    try {
      const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
      const defaultType = isTimeline ? 'timeline' as const : 'text' as const;
      const memoGroupId = isMemoPanel && effectiveGroupId ? effectiveGroupId : undefined;

      await addEntry({
        content: text,
        panel,
        type: defaultType,
        ...(isTimeline ? {
          timelineGroupId: effectiveGroupId,
          eventTime: timeTrimmed || undefined,
          eventTimeSortKey: sortKey,
        } : {}),
        ...(memoGroupId ? { groupId: memoGroupId } : {}),
      });
      addToast('メモを追加しました');
      setValue('');
      timeInput.reset();

      requestAnimationFrame(() => {
        if (isTimeline && timeInput.timeRef.current) {
          timeInput.timeRef.current.focus();
        } else {
          inputRef.current?.focus();
        }
      });
    } finally {
      submittingRef.current = false;
    }
  }, [value, timeInput, panel, isTimeline, isMemoPanel, effectiveGroupId, addEntry, addToast]);

  const disabled = isTimeline && timelineGroups.length === 0;
  const isTop = inputPosition === 'top';

  return (
    <div
      className={`px-2.5 pt-1.5 pb-2 bg-bg-surface shrink-0 flex flex-col gap-1 ${
        isTop ? 'border-b border-border-subtle' : 'border-t border-border-subtle'
      }`}
    >
      {/* グループセレクタ + 追加ボタン */}
      <GroupSelector panel={panel} />

      {/* 入力行 */}
      <div className="flex gap-1 items-center min-h-6">
        {isTimeline && (
          <input
            ref={timeInput.timeRef}
            value={timeInput.timeValue}
            onChange={(e) => timeInput.handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                inputRef.current?.focus();
              }
            }}
            placeholder="--:--"
            disabled={disabled}
            aria-label="時刻"
            aria-invalid={timeInput.timeError || undefined}
            aria-describedby={timeInput.timeError ? 'entry-time-error' : undefined}
            className="w-11 shrink-0 bg-transparent border-0 border-b text-panel-timeline-accent font-mono text-sm px-0.5 py-px outline-none text-center tracking-wide transition-[border-color] duration-150 focus:border-b-panel-timeline-accent"
            style={{
              borderBottomColor: timeInput.timeError ? 'var(--importance-high)' : undefined,
              opacity: disabled ? 0.4 : undefined,
            }}
            onBlur={timeInput.handleBlur}
          />
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setTextError(false);
            resizeInput(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            disabled
              ? 'まずメモグループを追加してください'
              : 'メモを入力… (Shift+Enter で改行)'
          }
          disabled={disabled}
          aria-invalid={textError || undefined}
          aria-describedby={textError ? 'entry-text-error' : undefined}
          rows={1}
          className="flex-1 min-w-0 bg-transparent border-0 text-text-primary font-sans text-sm leading-[1.2] py-px resize-none outline-none overflow-hidden"
          style={{
            borderBottom: textError ? '1px solid var(--importance-high)' : undefined,
            opacity: disabled ? 0.4 : undefined,
          }}
        />

        {/* 画像追加ボタン */}
        {openImagePicker && (
          <button
            onClick={openImagePicker}
            title="画像を追加"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1" />
              <path d="M1.5 11l3.5-3.5 2.5 2.5 2-2 5 5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* スクリーンリーダー用エラーメッセージ */}
      {timeInput.timeError && <span id="entry-time-error" className="sr-only">時刻の形式が正しくありません</span>}
      {textError && <span id="entry-text-error" className="sr-only">テキストを入力してください</span>}
    </div>
  );
}
