import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { autoCompleteTime, normalizeTimeInput, parseEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';
import { Plus } from '@/components/icons';

interface EntryInputProps {
  panel: PanelId;
}

export function EntryInput({ panel }: EntryInputProps) {
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const addTimelineGroup = useStore((s) => s.addTimelineGroup);
  const inputPosition = useStore((s) => s.settings.inputPosition);

  const [value, setValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [selectedGroupId, persistGroupId] = useLocalStorage(`murder-memo-selected-group-${panel}`, '');
  const [timeError, setTimeError] = useState(false);
  const [textError, setTextError] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const { resize: resizeInput } = useAutoResizeTextarea(120);

  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  // グループ一覧
  const groups = useMemo(() => {
    if (isTimeline) return timelineGroups;
    if (isMemoPanel) return memoGroups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
    return [];
  }, [isTimeline, isMemoPanel, timelineGroups, memoGroups, panel]);

  // selectedGroupId が現存するグループに含まれなければリセット
  const validSelectedId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId = isTimeline && timelineGroups.length === 1 && !validSelectedId
    ? timelineGroups[0].id
    : validSelectedId;

  useEffect(() => {
    resizeInput(inputRef.current);
  }, [value, resizeInput]);

  const submit = useCallback(async () => {
    const text = value.trim();
    const timeTrimmed = autoCompleteTime(timeValue);

    if (isTimeline) {
      if (!text && !timeTrimmed) return;
      if (timeTrimmed && !text) { setTextError(true); return; }
      if (!effectiveGroupId) return;
    } else {
      if (!text) return;
    }
    const sortKey = timeTrimmed ? parseEventTime(timeTrimmed) : undefined;
    const defaultType = isTimeline ? 'timeline' as const : 'text' as const;
    const memoGroupId = isMemoPanel && selectedGroupId ? selectedGroupId : undefined;

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
    setValue('');
    setTimeValue('');

    requestAnimationFrame(() => {
      if (isTimeline && timeRef.current) {
        timeRef.current.focus();
      } else {
        inputRef.current?.focus();
      }
    });
  }, [value, timeValue, panel, isTimeline, isMemoPanel, effectiveGroupId, selectedGroupId, addEntry]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    if (isTimeline) {
      const group = await addTimelineGroup(label);
      persistGroupId(group.id);
    } else if (isMemoPanel) {
      const group = await addMemoGroup(label, panel as 'free' | 'personal');
      persistGroupId(group.id);
    }
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, isTimeline, isMemoPanel, panel, addTimelineGroup, addMemoGroup, persistGroupId]);

  const disabled = isTimeline && timelineGroups.length === 0;
  const isTop = inputPosition === 'top';

  // ── グループセレクタ + 追加ボタン行（常に表示） ──
  const groupRow = (
    <div className="flex gap-1 items-center min-h-6">
      {/* グループセレクタ */}
      <select
        value={effectiveGroupId}
        onChange={(e) => persistGroupId(e.target.value)}
        aria-label="追加先メモグループ"
        className="flex-1 bg-bg-elevated border border-border-subtle rounded-sm text-text-secondary text-sm px-1.5 py-[3px] outline-none"
      >
        {isTimeline ? (
          <>
            <option value="">{groups.length === 0 ? 'メモグループなし' : 'メモグループを選択…'}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        ) : (
          <>
            <option value="">未分類</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </>
        )}
      </select>

      {/* グループ追加 */}
      {isAddingGroup ? (
        <div className="flex gap-1 items-center">
          <input
            autoFocus
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddGroup();
              if (e.key === 'Escape') {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            onBlur={() => {
              if (!newGroupLabel.trim()) {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            placeholder={isTimeline ? '当日、前日 等' : 'メモグループ名'}
            aria-label="メモグループ名"
            className="flex-1 min-w-[60px] bg-bg-base border border-border-default rounded-sm text-text-primary text-sm px-1.5 py-[3px] outline-none"
          />
          <button
            onClick={handleAddGroup}
            className="btn-primary btn-sm text-sm"
          >
            追加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          title="メモグループを追加"
          className="flex items-center bg-transparent border border-dashed border-border-default rounded-sm text-text-muted text-sm px-2 py-[3px] cursor-pointer transition-[border-color,color] duration-150 whitespace-nowrap hover:border-border-strong hover:text-text-secondary"
        >
          <Plus size={12} strokeWidth={2.5} className="mr-1" />
          メモグループ
        </button>
      )}
    </div>
  );

  // ── 入力行 ──
  const inputRow = (
    <div className="flex gap-1 items-center min-h-6">
      {isTimeline && (
        <input
          ref={timeRef}
          value={timeValue}
          onChange={(e) => { setTimeValue(normalizeTimeInput(e.target.value)); setTimeError(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
          placeholder="--:--"
          disabled={disabled}
          aria-label="時刻"
          aria-invalid={timeError || undefined}
          aria-describedby={timeError ? 'entry-time-error' : undefined}
          className="w-11 shrink-0 bg-transparent border-0 border-b text-panel-timeline-accent font-mono text-sm px-0.5 py-px outline-none text-center tracking-wide transition-[border-color] duration-150 focus:border-b-panel-timeline-accent"
          style={{
            borderBottomColor: timeError ? 'var(--importance-high)' : undefined,
            opacity: disabled ? 0.4 : undefined,
          }}
          onBlur={() => {
            setTimeValue((v) => autoCompleteTime(v));
          }}
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
          if (e.key === 'Enter' && !e.shiftKey) {
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
        className="flex-1 min-w-0 bg-transparent border-0 text-text-primary font-sans text-[13px] leading-[1.6] py-px resize-none outline-none overflow-hidden"
        style={{
          borderBottom: textError ? '1px solid var(--importance-high)' : undefined,
          opacity: disabled ? 0.4 : undefined,
        }}
      />
    </div>
  );

  return (
    <div
      className={`px-2.5 pt-1.5 pb-2 bg-bg-surface shrink-0 flex flex-col gap-1 ${
        isTop ? 'border-b border-border-subtle' : 'border-t border-border-subtle'
      }`}
    >
      {groupRow}
      {inputRow}
      {/* スクリーンリーダー用エラーメッセージ */}
      {timeError && <span id="entry-time-error" className="sr-only">時刻の形式が正しくありません</span>}
      {textError && <span id="entry-text-error" className="sr-only">テキストを入力してください</span>}
    </div>
  );
}
