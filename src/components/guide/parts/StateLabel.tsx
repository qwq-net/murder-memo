/**
 * プレビュー枠の中で「これは hover の状態」「これは selected の状態」を示す小ラベル。
 *
 * - 同じコンポーネントの異なる状態を並べるプレビュー（重要度 / バッジ format / グループ状態 等）で
 *   各バリエーションの上に置いて、何を見せているかを明示する
 * - 色とサイズは「補足ラベルだが背景に埋もれない」レベルに調整してある
 */
export function StateLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        letterSpacing: '0.06em',
        background: 'var(--bg-elevated)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </span>
  );
}
