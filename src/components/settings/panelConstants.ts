/**
 * 設定パネル / バックアップセクション等で利用する、パネル別の表示用定数。
 *
 * 実体は lib/panelMeta に一元化済み。ここでは既存利用箇所の import 名（PANEL_CARD_ACCENT /
 * PANEL_ORDER_LABELS）を壊さないよう alias 再 export する薄いラッパとして残す。
 */

export {
  PANEL_ACCENT as PANEL_CARD_ACCENT,
  PANEL_LABEL as PANEL_ORDER_LABELS,
} from '@/lib/panelMeta';
