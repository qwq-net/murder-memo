import { useCallback } from 'react';

/**
 * textarea の高さを内容に合わせて自動調整するフック。
 * TextEntry, TimelineEntry, EntryInput で共通利用。
 */
export function useAutoResizeTextarea(maxHeight?: number) {
  const resize = useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = 'auto';
      if (maxHeight != null) {
        const next = Math.min(el.scrollHeight, maxHeight);
        el.style.height = next + 'px';
        el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
      } else {
        el.style.height = el.scrollHeight + 'px';
      }
    },
    [maxHeight],
  );

  return { resize };
}
