import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { StateLabel } from '@/components/guide/parts/StateLabel';
import { GUIDE_SAMPLE_CHARACTERS } from '@/components/guide/previews/sampleData';
import type { CharacterDisplayFormat } from '@/types/memo';

const FORMATS: { label: string; format: CharacterDisplayFormat }[] = [
  { label: 'フル', format: 'full' },
  { label: 'バッジ', format: 'badge' },
  { label: 'テキスト', format: 'text' },
];

/**
 * バッジの表示形式（フル / バッジ / テキスト）を 3 行で並べるプレビュー。
 *
 * 本体の `CharacterBadgeBarView` をそのまま使い、同じキャラクター集合に対する
 * 描画の違いを一望できるようにする。1 件目のキャラだけアクティブ状態にして、
 * アクティブ / 非アクティブの差も見えるようにする。
 */
export function BadgeFormatPreview() {
  const activeIds = new Set([GUIDE_SAMPLE_CHARACTERS[0].id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {FORMATS.map(({ label, format }) => (
        <div key={format} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StateLabel>{label}</StateLabel>
          <CharacterBadgeBarView
            characters={GUIDE_SAMPLE_CHARACTERS}
            activeCharacterIds={activeIds}
            onToggle={() => undefined}
            format={format}
            visibility="always"
            isEntryHovered={false}
            hasEffectiveActive={true}
          />
        </div>
      ))}
    </div>
  );
}
