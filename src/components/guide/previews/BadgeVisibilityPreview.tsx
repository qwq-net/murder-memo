import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { StateLabel } from '@/components/guide/parts/StateLabel';
import { GUIDE_SAMPLE_CHARACTERS } from '@/components/guide/previews/sampleData';
import type { CharacterDisplayVisibility } from '@/types/memo';

interface Variant {
  label: string;
  visibility: CharacterDisplayVisibility;
  isEntryHovered: boolean;
}

const VARIANTS: Variant[] = [
  { label: '常時', visibility: 'always', isEntryHovered: false },
  { label: 'ミニマル（カード非ホバー時）', visibility: 'minimal', isEntryHovered: false },
  { label: 'ミニマル（カードホバー時）', visibility: 'minimal', isEntryHovered: true },
  { label: 'オフ', visibility: 'off', isEntryHovered: false },
];

/**
 * バッジの表示モード（常時 / ミニマル / オフ）を並べるプレビュー。
 *
 * 本体の `CharacterBadgeBarView` をそのまま使い、同じキャラクター集合に対する
 * 描画の違いを 4 行で見せる。「ミニマル」は非ホバー / ホバーの 2 状態を別行に分け、
 * 紐付け済みのバッジだけ常時表示される様子と、ホバー時に全表示される様子を比較できるようにする。
 *
 * 1 件目のキャラを「紐付け済み」として扱い、ミニマル時もそれだけは常時表示される。
 */
export function BadgeVisibilityPreview() {
  const activeIds = new Set([GUIDE_SAMPLE_CHARACTERS[0].id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {VARIANTS.map(({ label, visibility, isEntryHovered }) => (
        <div
          key={`${visibility}-${isEntryHovered}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <StateLabel>{label}</StateLabel>
          <CharacterBadgeBarView
            characters={GUIDE_SAMPLE_CHARACTERS}
            activeCharacterIds={activeIds}
            onToggle={() => undefined}
            format="full"
            visibility={visibility}
            isEntryHovered={isEntryHovered}
            hasEffectiveActive={true}
          />
        </div>
      ))}
    </div>
  );
}
