import { useState } from 'react';

import { EntryCardView } from '@/components/entries/entryCardView';
import { ImageEntryView } from '@/components/entries/imageEntryView';
import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_IMAGE_ENTRY,
  GUIDE_SAMPLE_IMAGE_SRC,
  GUIDE_SAMPLE_LINK_KEYWORDS,
} from '@/components/guide/previews/sampleData';

/**
 * 画像メモのプレビュー。
 *
 * 本物の `EntryCardView` + `ImageEntryView` をそのまま使い、サムネイル + キャプション
 * + インラインリンク（`[ペーパーナイフ]` 部分が破線下線で描画される）の組み合わせを見せる。
 * サムネイルクリックで「Lightbox を開いた」状態を局所 state で示す（ここでは実モーダルは出さない）。
 */
export function ImageEntryPreview() {
  const entry = GUIDE_SAMPLE_IMAGE_ENTRY;
  const [hovered, setHovered] = useState(false);

  return (
    <EntryCardView
      entry={entry}
      hovered={hovered}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ImageEntryView
        entry={entry}
        visibleCharacters={GUIDE_SAMPLE_CHARACTERS}
        linkKeywords={GUIDE_SAMPLE_LINK_KEYWORDS}
        imageSrc={GUIDE_SAMPLE_IMAGE_SRC}
        format="badge"
        visibility="always"
        isHovered={hovered}
      />
    </EntryCardView>
  );
}
