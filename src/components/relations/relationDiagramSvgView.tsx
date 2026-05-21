import { useMemo } from 'react';

import type { Character, CharacterRelation } from '@/types/memo';

const WORLD_SIZE = 320;
const CX = WORLD_SIZE / 2;
const CY = WORLD_SIZE / 2;
const RADIUS = 120;
const NODE_R = 20;

interface RelationDiagramSvgViewProps {
  /** 円周上に配置するキャラクター（sortOrder 順想定。未ソートでも呼び出し側で OK） */
  characters: Character[];
  /** 描画する関係線 */
  relations: CharacterRelation[];
  /**
   * SVG 描画範囲を指定する viewBox（任意）。
   * 省略時は WORLD_SIZE 全体を描画する（ズーム / パンなし）。
   */
  viewBox?: { x: number; y: number; size: number };
}

/**
 * `RelationDiagramSvg` の SVG 描画ロジックを切り出した純粋表示版。
 *
 * - props で characters / relations を受け取り、`useStore` には触れない
 * - 円周配置の計算と SVG（線・ラベル・ノード）描画だけを担当する
 * - ズーム / パン / ボタン UI は持たない（編集系は呼び出し側の責務）
 * - Guide ページのように本物の store に依存できない場面でそのまま使える
 */
export function RelationDiagramSvgView({
  characters,
  relations,
  viewBox,
}: RelationDiagramSvgViewProps) {
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

  const vbX = viewBox?.x ?? 0;
  const vbY = viewBox?.y ?? 0;
  const vbSize = viewBox?.size ?? WORLD_SIZE;

  return (
    <svg
      width="100%"
      height={WORLD_SIZE}
      viewBox={`${vbX} ${vbY} ${vbSize} ${vbSize}`}
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
            <text x={mx} y={my - 4} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>
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
            <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={c.color} opacity={0.85} />
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
  );
}
