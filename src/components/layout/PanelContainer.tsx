import { useCallback, useRef } from 'react';

import { useStore } from '../../store';
import type { PanelId } from '../../types/memo';
import { ResizeHandle } from './ResizeHandle';

interface PanelContainerProps {
  panels: {
    id: PanelId;
    node: React.ReactNode;
  }[];
}

export function PanelContainer({ panels }: PanelContainerProps) {
  const sizes = useStore((s) => s.layout.sizes);
  const setLayout = useStore((s) => s.setLayout);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDelta = useCallback(
    (index: 0 | 1, dx: number) => {
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth;
      const dPct = (dx / containerW) * 100;

      setLayout({
        sizes: sizes.map((s, i) => {
          if (i === index) return Math.max(10, s + dPct);
          if (i === index + 1) return Math.max(10, s - dPct);
          return s;
        }) as [number, number, number],
      });
    },
    [sizes, setLayout],
  );

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%', minHeight: 0 }}
    >
      {panels.map((panel, i) => (
        <div key={panel.id} style={{ display: 'contents' }}>
          <div
            style={{
              width: `${sizes[i]}%`,
              minWidth: 0,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {panel.node}
          </div>
          {i < panels.length - 1 && (
            <ResizeHandle onDelta={(dx) => handleDelta(i as 0 | 1, dx)} />
          )}
        </div>
      ))}
    </div>
  );
}
