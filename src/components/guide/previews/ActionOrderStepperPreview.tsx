import { GUIDE_SAMPLE_CHARACTERS } from '@/components/guide/previews/sampleData';
import { ChevronRight } from '@/components/icons';
import { splitCharactersByRole } from '@/lib/characterSort';

const { plChars: PL_CHARS, npcChars: NPC_CHARS } = splitCharactersByRole(GUIDE_SAMPLE_CHARACTERS);

/**
 * ヘッダー右側に表示される「行動順ステッパー」のプレビュー。
 *
 * 本体（`appShell.tsx`）の同 UI を SSG 制約に合わせて軽量化し、`useStore` ではなく
 * `GUIDE_SAMPLE_CHARACTERS` を直接読む純粋関数として実装する。
 * PL → セパレータ `|` → NPC の並びと、`sortOrder` による行動順を再現する。
 */
export function ActionOrderStepperPreview() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {PL_CHARS.map((char, i) => (
        <div key={char.id} className="flex shrink-0 items-center">
          {i > 0 && <ChevronRight size={14} className="text-text-faint mx-0.5 shrink-0" />}
          <span className="text-text-secondary flex items-center gap-1 text-sm whitespace-nowrap">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }}
            />
            {char.name}
          </span>
        </div>
      ))}

      {PL_CHARS.length > 0 && NPC_CHARS.length > 0 && (
        <span className="text-text-faint mx-1 shrink-0 text-sm">|</span>
      )}

      {NPC_CHARS.map((char, i) => (
        <div key={char.id} className="flex shrink-0 items-center">
          {i > 0 && <ChevronRight size={14} className="text-text-faint mx-0.5 shrink-0" />}
          <span className="text-text-muted flex items-center gap-1 text-sm whitespace-nowrap">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full opacity-70"
              style={{ background: char.color, boxShadow: `0 0 6px ${char.color}44` }}
            />
            {char.name}
          </span>
        </div>
      ))}
    </div>
  );
}
