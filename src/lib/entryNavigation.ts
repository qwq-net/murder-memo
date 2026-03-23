import type { PanelId } from '@/types/memo';

/**
 * 指定エントリにスクロール + フラッシュアニメーション。
 * パネル切替が必要な場合は setActivePanel を呼んでから DOM 更新を待つ。
 */
export function navigateToEntry(
  entryId: string,
  panel: PanelId,
  setActivePanel: (panel: PanelId) => void,
): void {
  setActivePanel(panel);
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('entry-flash');
    // reflow を挟んでアニメーションを再トリガー可能にする
    void (el as HTMLElement).offsetWidth;
    el.classList.add('entry-flash');
    el.addEventListener('animationend', () => el.classList.remove('entry-flash'), { once: true });
  });
}
