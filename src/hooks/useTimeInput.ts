import { useCallback, useRef, useState } from 'react';

import { autoCompleteTime, normalizeTimeInput } from '@/lib/timeParser';

/**
 * タイムライン入力用の時刻入力ステート管理フック。
 * 時刻値・バリデーション・入力補完を一括管理する。
 */
export function useTimeInput() {
  const [timeValue, setTimeValue] = useState('');
  const [timeError, setTimeError] = useState(false);
  const timeRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((raw: string) => {
    setTimeValue(normalizeTimeInput(raw));
    setTimeError(false);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeValue((v) => autoCompleteTime(v));
  }, []);

  const reset = useCallback(() => {
    setTimeValue('');
    setTimeError(false);
  }, []);

  /** 自動補完を適用した最終的な時刻文字列を取得 */
  const getCompleted = useCallback(() => autoCompleteTime(timeValue), [timeValue]);

  return {
    timeValue,
    timeError,
    setTimeError,
    timeRef,
    handleChange,
    handleBlur,
    reset,
    getCompleted,
  } as const;
}
