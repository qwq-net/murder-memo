/**
 * 重要度絞り込みバーの純粋表示版（store 非依存）。
 *
 * 「高 / 中 / 低」を隙間なく連結したセグメントコントロール。各セルを枠で囲って連結することで、
 * 選択状態に関わらずセル幅・間隔が一定に見える（ボタン内パディングが非選択時に「すき間」として
 * 誤認されるのを防ぐ）。複数選択（トグル）可。store 連携は ImportanceFilterBar、ガイドの
 * プレビューは ImportanceFilterBarPreview がこの View を再利用する。
 */
import { X } from '@/components/icons';
import type { ImportanceLevel } from '@/types/memo';

const LEVELS: { level: ImportanceLevel; label: string; color: string }[] = [
  { level: 'high', label: '高', color: 'var(--importance-high)' },
  { level: 'medium', label: '中', color: 'var(--importance-medium)' },
  { level: 'low', label: '低', color: 'var(--importance-low)' },
];

interface ImportanceFilterBarViewProps {
  /** 現在アクティブな重要度レベル */
  activeLevels: ImportanceLevel[];
  /** セルクリック時のトグル */
  onToggle: (level: ImportanceLevel) => void;
  /** クリアボタンクリック */
  onClear: () => void;
}

export function ImportanceFilterBarView({
  activeLevels,
  onToggle,
  onClear,
}: ImportanceFilterBarViewProps) {
  const hasActiveFilter = activeLevels.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {/* 高/中/低 のセグメントコントロール（外周を1枚の枠で囲み、セル間は細線で区切る） */}
      <div
        role="group"
        aria-label="重要度で絞り込み"
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        {LEVELS.map(({ level, label, color }, i) => {
          const active = activeLevels.includes(level);
          return (
            <button
              key={level}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(level);
              }}
              aria-pressed={active}
              aria-label={`重要度「${label}」${active ? 'の絞り込みを解除' : 'で絞り込み'}`}
              title={`重要度「${label}」`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                // セル間の区切り線（先頭以外）。外周は親の border が担う
                borderLeft: i === 0 ? 'none' : '1px solid var(--border-default)',
                background: active
                  ? `color-mix(in srgb, ${color} 22%, transparent)`
                  : 'transparent',
                color: active ? color : `color-mix(in srgb, ${color} 60%, transparent)`,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                lineHeight: 1,
                minWidth: 26,
                minHeight: 22,
                padding: '0 7px',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.background = `color-mix(in srgb, ${color} 10%, transparent)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = `color-mix(in srgb, ${color} 60%, transparent)`;
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {hasActiveFilter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="btn-ghost btn-sm"
          title="重要度フィルターをクリア"
          aria-label="重要度フィルターをクリア"
          style={{ padding: 2 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
