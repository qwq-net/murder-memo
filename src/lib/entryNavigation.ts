import type { PanelId } from '@/types/memo';

/** 要素出現を待つ最大フレーム数。グループ展開・フィルタ解除の再レンダー反映を吸収する。 */
const MAX_FRAMES = 5;

/**
 * 指定エントリへスクロールし、一時的なフラッシュアニメーションで強調する。
 *
 * - まず setActivePanel(panel) を呼び、`[data-entry-id]` 要素を探す。折りたたみグループの展開や
 *   キャラクターフィルター解除（呼び出し側が revealEntry 等で行う）による再レンダー反映を待つため、
 *   見つからなければ最大 {@link MAX_FRAMES} フレームまで requestAnimationFrame で再試行する
 * - 最終的に見つからなければ onNotFound?.() を呼ぶ（呼び出し側はトースト等で通知できる）。
 *   従来は黙って no-op だったため、折りたたみ/フィルタで非表示のエントリへ検索遷移すると無反応だった
 * - フラッシュは entry-flash クラスの付け外しで行い、連続呼び出しでも再生されるよう reflow を挟む
 */
export function navigateToEntry(
  entryId: string,
  panel: PanelId,
  setActivePanel: (panel: PanelId) => void,
  onNotFound?: () => void,
): void {
  setActivePanel(panel);
  let frames = 0;
  const tryScroll = () => {
    const el = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (!el) {
      frames += 1;
      if (frames < MAX_FRAMES) {
        requestAnimationFrame(tryScroll);
      } else {
        onNotFound?.();
      }
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('entry-flash');
    // reflow を挟んでアニメーションを再トリガー可能にする
    void (el as HTMLElement).offsetWidth;
    el.classList.add('entry-flash');
    el.addEventListener('animationend', () => el.classList.remove('entry-flash'), { once: true });
  };
  requestAnimationFrame(tryScroll);
}
