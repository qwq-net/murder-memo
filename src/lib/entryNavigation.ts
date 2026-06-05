import type { PanelId } from '@/types/memo';

/**
 * 指定エントリへスクロールし、一時的なフラッシュアニメーションで強調する。
 *
 * - まず setActivePanel(panel) を呼び、requestAnimationFrame で DOM 反映を1フレーム待ってから
 *   `[data-entry-id]` 要素を探す（パネル切替直後でも対象が描画済みになるように）
 * - 対象 entryId の要素が DOM に存在しなければスクロールもフラッシュも行わない（no-op）
 * - フラッシュは entry-flash クラスの付け外しで行い、連続呼び出しでも再生されるよう reflow を挟む
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
