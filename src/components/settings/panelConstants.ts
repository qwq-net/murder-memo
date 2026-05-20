import type { PanelId } from '@/types/memo';

/**
 * 設定パネル / バックアップセクション等で利用する、パネル別の表示用定数。
 *
 * NOTE: 定数と React コンポーネントを同一ファイルから export すると Vite の Fast Refresh が
 * 効かなくなる（react-refresh/only-export-components 警告）ため、定数群はこちらに分離している。
 */

/** パネル別のアクセントカラー（CSS variable 参照） */
export const PANEL_CARD_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  timeline: 'var(--panel-timeline-accent)',
  personal: 'var(--panel-personal-accent)',
};

/** パネル別の日本語ラベル */
export const PANEL_ORDER_LABELS: Record<PanelId, string> = {
  free: 'フリーメモ',
  timeline: 'タイムライン',
  personal: '自分用メモ',
};
