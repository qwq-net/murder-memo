import { DeductionRowView } from '@/components/deductions/deductionRowView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_DEDUCTIONS,
} from '@/components/guide/previews/sampleData';

const characterMap = new Map(GUIDE_SAMPLE_CHARACTERS.map((c) => [c.id, c]));

/**
 * 人物推理メモの PL / NPC リストを本物の `DeductionRowView` で見せるプレビュー。
 *
 * - 4 件のサンプル（疑惑度 0/1/2/3 を網羅）を PL セクションに並べる
 * - 各行の★クリックで疑惑度を切り替えられる挙動も本体と同じ
 *   （onChangeLevel に noop を渡しているので確定しても保存はされない）
 */
export function DeductionRowsPreview() {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          padding: '4px 0 6px',
        }}
      >
        プレイヤー
      </div>
      {GUIDE_SAMPLE_DEDUCTIONS.map((deduction) => {
        const character = characterMap.get(deduction.characterId);
        if (!character) return null;
        return (
          <DeductionRowView
            key={deduction.id}
            characterName={character.name}
            characterColor={character.color}
            suspicionLevel={deduction.suspicionLevel}
            memo={deduction.memo}
          />
        );
      })}
    </div>
  );
}
