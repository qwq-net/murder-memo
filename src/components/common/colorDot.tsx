/**
 * キャラクター色やパネルアクセント色を示す小さな丸。
 * 多数箇所でインライン定義されていた `width/height/borderRadius:50%/background/flexShrink` の
 * span を集約する（既定サイズ 8px）。
 */
export function ColorDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }}
    />
  );
}
