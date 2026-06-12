import { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  /** ドラッグ軸。horizontal=カラム幅（dx）、vertical=段の高さ（dy） */
  direction?: 'horizontal' | 'vertical';
  /** ドラッグ中の移動量（px）。direction に応じて dx / dy を渡す */
  onDelta: (delta: number) => void;
  /** ドラッグ確定（mouseup）時に1回呼ばれる。レイアウトの永続化に使う */
  onCommit?: () => void;
}

export function ResizeHandle({ direction = 'horizontal', onDelta, onCommit }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const isHorizontal = direction === 'horizontal';
      dragging.current = true;
      lastPos.current = isHorizontal ? e.clientX : e.clientY;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const pos = isHorizontal ? ev.clientX : ev.clientY;
        const delta = pos - lastPos.current;
        lastPos.current = pos;
        onDelta(delta);
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        onCommit?.();
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [direction, onDelta, onCommit],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className={`bg-border-subtle hover:bg-accent-dim relative z-10 shrink-0 transition-colors duration-150 ${
        direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'
      }`}
      style={
        direction === 'horizontal' ? { width: 'var(--resize-w)' } : { height: 'var(--resize-w)' }
      }
    />
  );
}
