import { useCallback, useMemo, useRef, useState } from 'react';

import { useStore } from '@/store';

const WORLD_SIZE = 320;
const CX = WORLD_SIZE / 2;
const CY = WORLD_SIZE / 2;
const RADIUS = 120;
const NODE_R = 20;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

/** キャラクターを円周上に配置し、関係線を描画する SVG（ズーム・パン対応） */
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

  // ── ズーム・パン状態 ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // viewBox を計算: ズームが上がると viewBox が小さくなる（拡大）
  const viewSize = WORLD_SIZE / zoom;
  const vx = CX - viewSize / 2 - pan.x;
  const vy = CY - viewSize / 2 - pan.y;

  // ホイールズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))));
  }, []);

  // ドラッグパン
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = WORLD_SIZE / zoom / rect.width;
    setPan({
      x: dragRef.current.startPanX + (e.clientX - dragRef.current.startX) * scale,
      y: dragRef.current.startPanY + (e.clientY - dragRef.current.startY) * scale,
    });
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
      {/* ズームコントロール */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP * 2))}
          className="btn-ghost"
          style={{ width: 24, height: 24, padding: 0, justifyContent: 'center', fontSize: 14 }}
        >
          −
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP * 2))}
          className="btn-ghost"
          style={{ width: 24, height: 24, padding: 0, justifyContent: 'center', fontSize: 14 }}
        >
          +
        </button>
        <button
          onClick={handleReset}
          className="btn-ghost"
          style={{ height: 24, padding: '0 6px', fontSize: 12 }}
        >
          リセット
        </button>
      </div>

      {/* SVG */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          display: 'flex',
          justifyContent: 'center',
          cursor: dragRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <svg
          width="100%"
          height={WORLD_SIZE}
          viewBox={`${vx} ${vy} ${viewSize} ${viewSize}`}
          style={{ maxWidth: WORLD_SIZE * 1.5 }}
        >
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
    </div>
  );
}
