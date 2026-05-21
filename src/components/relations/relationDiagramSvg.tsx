import { useCallback, useRef, useState } from 'react';

import { RelationDiagramSvgView } from '@/components/relations/relationDiagramSvgView';
import { useStore } from '@/store';

const WORLD_SIZE = 320;
const CX = WORLD_SIZE / 2;
const CY = WORLD_SIZE / 2;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

/** キャラクターを円周上に配置し、関係線を描画する SVG（ズーム・パン対応） */
export function RelationDiagramSvg() {
  const characters = useStore((s) => s.characters);
  const relations = useStore((s) => s.relations);

  // ── ズーム・パン状態 ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // ドラッグ位置情報は ref（追従計算用、再レンダー不要）
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  // カーソル表示用にドラッグ中フラグは state で持つ（render で参照するため）
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // viewBox を計算: ズームが上がると viewBox が小さくなる（拡大）
  const viewSize = WORLD_SIZE / zoom;
  const vx = CX - viewSize / 2 - pan.x;
  const vy = CY - viewSize / 2 - pan.y;

  // ホイールズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))),
    );
  }, []);

  // ドラッグパン
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      setIsDragging(true);
    },
    [pan],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = WORLD_SIZE / zoom / rect.width;
      setPan({
        x: dragRef.current.startPanX + (e.clientX - dragRef.current.startX) * scale,
        y: dragRef.current.startPanY + (e.clientY - dragRef.current.startY) * scale,
      });
    },
    [zoom],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
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
        <span
          style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}
        >
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
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <RelationDiagramSvgView
          characters={characters}
          relations={relations}
          viewBox={{ x: vx, y: vy, size: viewSize }}
        />
      </div>
    </div>
  );
}
