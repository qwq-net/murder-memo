import { EntryCardView } from '@/components/entries/entryCardView';
import { TextEntryView } from '@/components/entries/textEntryView';
import { StateLabel } from '@/components/guide/parts/StateLabel';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_FREE_ENTRIES,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';

const STATES: { label: string; hovered: boolean; selected: boolean }[] = [
  { label: '通常', hovered: false, selected: false },
  { label: 'マウスホバー', hovered: true, selected: false },
  { label: '選択中', hovered: false, selected: true },
];

/**
 * 同一エントリを「通常 / マウスホバー / 選択中」の 3 つの状態で並べるプレビュー。
 *
 * 本体の `EntryCardView` をそのまま使い、背景色や左縦線（パネル色 ↔ アクセント色）の
 * 変化が一望できるようにする。状態は `hovered` / `selected` props で固定するだけで再現できる。
 */
export function EntryStatesPreview() {
  const entry = GUIDE_SAMPLE_FREE_ENTRIES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {STATES.map((state) => (
        <div key={state.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StateLabel>{state.label}</StateLabel>
          <EntryCardView entry={entry} hovered={state.hovered} selected={state.selected}>
            <TextEntryView
              entry={entry}
              visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
              linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
              isHovered={state.hovered}
              format="badge"
              visibility="always"
            />
          </EntryCardView>
        </div>
      ))}
    </div>
  );
}
