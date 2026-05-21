/**
 * プレビュー枠の中で「これは hover の状態」「これは selected の状態」を示す小ラベル。
 *
 * - 同じコンポーネントの異なる状態を並べるプレビュー（重要度 / バッジ format / グループ状態 等）で
 *   各バリエーションの上に置いて、何を見せているかを明示する
 */
export function StateLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        color: 'var(--text-faint)',
        letterSpacing: '0.08em',
        background: 'var(--bg-base)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </span>
  );
}
