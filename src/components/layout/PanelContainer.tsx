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

// index.css の --resize-w と一致させる
const HANDLE_PX = 5;

export function PanelContainer({ panels }: PanelContainerProps) {
  const sizes = useStore((s) => s.layout.sizes);
  const setLayout = useStore((s) => s.setLayout);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDelta = useCallback(
    (index: 0 | 1, dx: number) => {
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth;
      // 高速ドラッグ中のstaleクロージャを回避するため直接state参照
      const currentSizes = useStore.getState().layout.sizes;
      const totalGrow = currentSizes.reduce((a, b) => a + b, 0);
      const availableW = containerW - HANDLE_PX * (panels.length - 1);
      const dGrow = (dx / availableW) * totalGrow;
      const minGrow = totalGrow * 0.1;

      setLayout({
        sizes: currentSizes.map((s, i) => {
          if (i === index) return Math.max(minGrow, s + dGrow);
          if (i === index + 1) return Math.max(minGrow, s - dGrow);
          return s;
        }) as [number, number, number],
      });
    },
    [panels.length, setLayout],
  );

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%', minHeight: 0 }}
    >
      {panels.flatMap((panel, i) => {
        const items: React.ReactNode[] = [
          <div
            key={panel.id}
            style={{
              flex: `${sizes[i]} 1 0`,
              minWidth: 120,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {panel.node}
          </div>,
        ];
        if (i < panels.length - 1) {
          items.push(
            <ResizeHandle key={`handle-${i}`} onDelta={(dx) => handleDelta(i as 0 | 1, dx)} />,
          );
        }
        return items;
      })}
    </div>
  );
}
