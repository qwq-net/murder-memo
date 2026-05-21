import { GUIDE_SAMPLE_LINK_KEYWORDS } from '@/components/guide/previews/sampleData';
import { LinkListItemView } from '@/components/links/linkListItemView';

/**
 * リンク一覧モーダルの内容を本物の `LinkListItemView` で見せるプレビュー。
 *
 * 各行のキーワード（青字 + 破線下線）と削除ボタンが、`/app` のリンク一覧と同じ見た目で並ぶ。
 */
export function LinkListPreview() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {GUIDE_SAMPLE_LINK_KEYWORDS.map((kw) => (
        <LinkListItemView key={kw.id} keyword={kw.keyword} />
      ))}
    </ul>
  );
}
