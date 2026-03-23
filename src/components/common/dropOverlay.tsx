/** 画像ドラッグ中のドロップゾーンオーバーレイ */
export function DropOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          border: '2px dashed var(--accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          color: 'var(--accent)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        画像をドロップして追加
      </div>
    </div>
  );
}
