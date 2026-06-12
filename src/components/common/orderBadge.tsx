/**
 * 並び順を示す丸数字バッジ（①②③相当）。
 * パネルの順番ヒントオーバーレイ（大）と並び順エディタの行頭（小）で共用し、
 * 「画面上の領域」と「エディタの行」が同じ記号で対応していることを視覚的に示す。
 */
export function OrderBadge({ number, size = 16 }: { number: number; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${size >= 32 ? 2 : 1}px solid currentColor`,
        fontSize: Math.round(size * 0.55),
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
        // 等幅で数字が中央からブレないように
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {number}
    </span>
  );
}
