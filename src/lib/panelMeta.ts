import type { PanelId } from '../types/memo';

/**
 * パネル別の表示メタ情報（アクセント色・日本語ラベル）の単一定義。
 * 6〜8ファイルに同一マップがコピーされていたものを集約する（色トークン変更時の追従漏れ防止）。
 */
export const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export const PANEL_LABEL: Record<PanelId, string> = {
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};
