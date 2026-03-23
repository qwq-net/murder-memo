import { useMemo } from 'react';

import { useStore } from '@/store';

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 120;
const NODE_R = 20;

/** キャラクターを円周上に配置し、関係線を描画する SVG */
export function RelationDiagramSvg() {
  const characters = useStore((s) => s.characters);
  const relations = useStore((s) => s.relations);

  const sorted = useMemo(
    () => [...characters].sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const count = sorted.length;
    sorted.forEach((c, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      map.set(c.id, {
        x: CX + RADIUS * Math.cos(angle),
        y: CY + RADIUS * Math.sin(angle),
      });
    });
    return map;
  }, [sorted]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* 関係線 + ラベル */}
        {relations.map((r) => {
          const from = positions.get(r.fromCharacterId);
          const to = positions.get(r.toCharacterId);
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          return (
            <g key={r.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={r.color || 'var(--border-strong)'}
                strokeWidth={1.5}
                opacity={0.6}
              />
              <text
                x={mx}
                y={my - 4}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize={11}
              >
                {r.label}
              </text>
            </g>
          );
        })}

        {/* キャラクターノード */}
        {sorted.map((c) => {
          const pos = positions.get(c.id);
          if (!pos) return null;
          return (
            <g key={c.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_R}
                fill={c.color}
                opacity={0.85}
              />
              <text
                x={pos.x}
                y={pos.y + NODE_R + 14}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize={12}
                fontWeight={500}
              >
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
