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
      style={{
        width: 'var(--resize-w)',
        flexShrink: 0,
        cursor: 'col-resize',
        background: 'var(--border-subtle)',
        position: 'relative',
        transition: 'background 0.15s',
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-dim)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--border-subtle)';
      }}
    />
  );
}
