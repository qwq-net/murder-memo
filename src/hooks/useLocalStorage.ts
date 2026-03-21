import { useCallback, useState } from 'react';

/**
 * localStorage を永続化先として使う状態フック。
 * EntryInput のグループ選択状態の永続化等で利用。
 */
export function useLocalStorage<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
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
