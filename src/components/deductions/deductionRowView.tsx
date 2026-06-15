import { useRef } from 'react';

import { ColorDot } from '@/components/common/colorDot';
import { useT } from '@/i18n';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

/** 疑惑度の取りうる値 */
export type SuspicionLevel = 0 | 1 | 2 | 3;

/** 星の色 — suspicionLevel に対応 */
const STAR_COLORS: Record<SuspicionLevel, string> = {
  0: 'var(--text-faint)',
  1: 'var(--importance-low)',
  2: 'var(--importance-medium)',
  3: 'var(--importance-high)',
};

interface StarRatingProps {
  value: SuspicionLevel;
  onChange: (value: SuspicionLevel) => void;
}

/**
 * 疑惑度の星評価（★ × 3）。同じ星を再度クリックすると 0 に戻る。
 *
 * `DeductionRowView` の内部部品。store 非依存なので Guide からも安全に使える。
 */
export function StarRating({ value, onChange }: StarRatingProps) {
  const t = useT();
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {([1, 2, 3] as const).map((level) => (
        <button
          key={level}
          onClick={() => onChange(value === level ? 0 : level)}
          title={
            value === level ? t('deductions.star.clear') : t('deductions.star.set', { level })
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            fontSize: 16,
            lineHeight: 1,
            color: level <= value ? STAR_COLORS[value] : 'var(--text-faint)',
            transition: 'color 0.12s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface DeductionRowViewProps {
  /** キャラクター名 */
  characterName: string;
  /** キャラクター色（左端の色丸） */
  characterColor: string;
  /** 疑惑度（★ 0〜3） */
  suspicionLevel: SuspicionLevel;
  /** 推理メモ本文 */
  memo: string;
  /** 疑惑度変更ハンドラ。Guide では noop で渡せる */
  onChangeLevel?: (level: SuspicionLevel) => void;
  /**
   * メモ確定（blur）ハンドラ。引数は trim 済みの文字列。
   * Guide では noop で渡せる。
   */
  onChangeMemo?: (memo: string) => void;
}

/**
 * 人物推理メモの 1 行分（色丸 + 名前 + 星 + 自由メモ）の純粋表示版。
 *
 * - `useStore` には依存せず、props で全データを受け取る
 * - メモの textarea は `defaultValue` + blur 保存の uncontrolled。
 *   onChange による高さ調整のために `useAutoResizeTextarea` だけ内部で使う
 *   （store / IDB 非依存の純粋 hook）
 */
export function DeductionRowView({
  characterName,
  characterColor,
  suspicionLevel,
  memo,
  onChangeLevel,
  onChangeMemo,
}: DeductionRowViewProps) {
  const { resize } = useAutoResizeTextarea();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* キャラクター名 + 星 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ColorDot color={characterColor} />
        <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{characterName}</span>
        <StarRating value={suspicionLevel} onChange={(v) => onChangeLevel?.(v)} />
      </div>

      {/* メモ */}
      <textarea
        ref={textareaRef}
        defaultValue={memo}
        onBlur={() => {
          const trimmed = textareaRef.current?.value.trim() ?? '';
          if (trimmed !== memo) onChangeMemo?.(trimmed);
        }}
        onChange={(e) => resize(e.target)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        rows={1}
        className="text-text-secondary ml-4 w-full resize-none overflow-hidden border-none bg-transparent p-0 text-sm leading-[1.4] outline-none"
      />
    </div>
  );
}
