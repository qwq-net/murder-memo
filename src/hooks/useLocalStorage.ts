import { useCallback, useState } from 'react';

/**
 * localStorage を永続化先として使う状態フック。
 * EntryInput のグループ選択状態の永続化等で利用。
 */
export function useLocalStorage(
  key: string,
  defaultValue: string,
): [string, (value: string) => void] {
  const [state, setState] = useState<string>(() => {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: string) => {
      setState(value);
      try {
        localStorage.setItem(key, value);
      } catch {
        /* noop — ストレージ不可時は無視 */
      }
    },
    [key],
  );

  return [state, setValue];
}
