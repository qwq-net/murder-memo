import { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  onDelta: (dx: number) => void;
}

export function ResizeHandle({ onDelta }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastX.current = e.clientX;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ev.clientX - lastX.current;
        lastX.current = ev.clientX;
        onDelta(delta);
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [onDelta],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="shrink-0 cursor-col-resize relative z-10 transition-colors duration-150 bg-border-subtle hover:bg-accent-dim"
      style={{ width: 'var(--resize-w)' }}
    />
  );
}
