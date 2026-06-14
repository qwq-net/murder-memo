import { ColorDot } from '@/components/common/colorDot';
import { OrderBadge } from '@/components/common/orderBadge';
import { PANEL_CARD_ACCENT, PANEL_ORDER_LABELS } from '@/components/settings/panelConstants';
import type { PanelId } from '@/types/memo';

/**
 * パネル並び順の ↑↓ エディタ。表示中パネルのみを対象とする可変長リスト
 * （非表示パネルは並び順を持たない。レイアウト設定の一部として使う）。
 */
export function PanelOrderEditor({
  order,
  onChange,
}: {
  order: PanelId[];
  onChange: (order: PanelId[]) => void;
}) {
  const swap = (index: number, direction: -1 | 1) => {
    const newOrder = [...order];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    onChange(newOrder);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {order.map((panelId, i) => (
        <div
          key={panelId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
          }}
        >
          {/* 順番バッジ — レイアウト変更時にパネル領域へ出る①②③と同じ記号・採番。
              「エディタの行」と「画面上の領域」の対応を視覚的につなぐ */}
          <span style={{ color: 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>
            <OrderBadge number={i + 1} size={16} />
          </span>
          {/* accent dot */}
          <ColorDot color={PANEL_CARD_ACCENT[panelId]} />

          {/* label */}
          <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>
            {PANEL_ORDER_LABELS[panelId]}
          </span>

          {/* up / down buttons */}
          <button
            disabled={i === 0}
            onClick={() => swap(i, -1)}
            aria-label="上に移動"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: i === 0 ? 'default' : 'pointer',
              color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 7.5L6 4.5L9 7.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            disabled={i === order.length - 1}
            onClick={() => swap(i, 1)}
            aria-label="下に移動"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: i === order.length - 1 ? 'default' : 'pointer',
              color: i === order.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
