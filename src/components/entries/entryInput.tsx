import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EntryInputView } from '@/components/entries/entryInputView';
import { GroupSelector } from '@/components/entries/groupSelector';
import { useImagePicker } from '@/components/layout/imagePickerContext';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTimeInput } from '@/hooks/useTimeInput';
import { useT } from '@/i18n';
import { resolveGroupSelection } from '@/lib/groupSelection';
import { isCommitEnter } from '@/lib/keyboardKeys';
import { resolveEventTime } from '@/lib/timeParser';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';

interface EntryInputProps {
  panel: PanelId;
}

/**
 * 入力欄の店長ラッパー。
 *
 * - 値・バリデーション・送信ロジックをここで保持し、表示は `EntryInputView` に委譲する
 * - グループセレクタは `GroupSelector`（store 連携版）を呼ぶ
 */
export function EntryInput({ panel }: EntryInputProps) {
  const t = useT();
  const addEntry = useStore((s) => s.addEntry);
  const timelineGroups = useStore((s) => s.timelineGroups);
  const memoGroups = useStore((s) => s.memoGroups);
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

  // グループ選択状態を EntryInput が一元管理し、GroupSelector と共有する
  const [selectedGroupId, setSelectedGroupId] = useLocalStorage(
    `murder-memo-selected-group-${panel}`,
    '',
  );

  // グループ候補と有効選択の解決は groupSelector と共通の純関数に集約
  const { effectiveGroupId } = useMemo(
    () => resolveGroupSelection(panel, { timelineGroups, memoGroups }, selectedGroupId),
    [panel, timelineGroups, memoGroups, selectedGroupId],
  );

  useEffect(() => {
    resizeInput(inputRef.current);
  }, [value, resizeInput]);

  const submit = useCallback(async () => {
    // 連打による重複送信を防止
    if (submittingRef.current) return;

    const text = value.trim();
    // 時刻は resolveEventTime に集約（eventTime と eventTimeSortKey の整合を単一経路で保証）
    const timeRaw = timeInput.timeValue.trim();
    const time = resolveEventTime(timeInput.timeValue);

    if (isTimeline) {
      if (!text && !timeRaw) return;
      if (timeRaw && !text) {
        setTextError(true);
        return;
      }
      // 不正な時刻（範囲外の "25:00" 等）は保存しない（eventTime/eventTimeSortKey の整合を保つ）
      if (!time.valid) {
        timeInput.setTimeError(true);
        return;
      }
      if (!effectiveGroupId) return;
    } else {
      if (!text) return;
    }

    submittingRef.current = true;
    try {
      const defaultType = isTimeline ? ('timeline' as const) : ('text' as const);
      const memoGroupId = isMemoPanel && effectiveGroupId ? effectiveGroupId : undefined;

      // addEntry は保存失敗時にロールバック＋エラートーストして throw する。
      // その場合は入力をクリアせず（再送できるように）成功トーストも出さない
      const created = await addEntry({
        content: text,
        panel,
        type: defaultType,
        ...(isTimeline && time.valid
          ? {
              timelineGroupId: effectiveGroupId,
              eventTime: time.eventTime,
              eventTimeSortKey: time.eventTimeSortKey,
            }
          : {}),
        ...(memoGroupId ? { groupId: memoGroupId } : {}),
      }).catch(() => null);
      if (!created) return;
      addToast(t('entries.input.added'));
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
  }, [value, timeInput, panel, isTimeline, isMemoPanel, effectiveGroupId, addEntry, addToast, t]);

  const disabled = isTimeline && timelineGroups.length === 0;
  const isTop = inputPosition === 'top';

  return (
    <EntryInputView
      isTimeline={isTimeline}
      isTop={isTop}
      disabled={disabled}
      groupSelector={
        <GroupSelector
          panel={panel}
          selectedGroupId={selectedGroupId}
          onGroupIdChange={setSelectedGroupId}
        />
      }
      value={value}
      onValueChange={(next) => {
        setValue(next);
        setTextError(false);
        if (inputRef.current) resizeInput(inputRef.current);
      }}
      onTextKeyDown={(e) => {
        if (isCommitEnter(e)) {
          e.preventDefault();
          submit();
        }
      }}
      placeholder={
        disabled ? t('entries.input.placeholderDisabled') : t('entries.input.placeholder')
      }
      textareaRef={inputRef}
      textError={textError}
      timeValue={isTimeline ? timeInput.timeValue : undefined}
      onTimeChange={isTimeline ? (v) => timeInput.handleChange(v) : undefined}
      onTimeKeyDown={
        isTimeline
          ? (e) => {
              if (isCommitEnter(e)) {
                e.preventDefault();
                inputRef.current?.focus();
              }
            }
          : undefined
      }
      onTimeBlur={isTimeline ? timeInput.handleBlur : undefined}
      timeRef={isTimeline ? timeInput.timeRef : undefined}
      timeError={isTimeline ? timeInput.timeError : undefined}
      onImagePickerOpen={openImagePicker ?? undefined}
    />
  );
}
