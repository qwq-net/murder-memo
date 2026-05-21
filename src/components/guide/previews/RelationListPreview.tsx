import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_RELATIONS_FULL,
} from '@/components/guide/previews/sampleData';
import { RelationListItemView } from '@/components/relations/relationListItemView';

const characterMap = new Map(GUIDE_SAMPLE_CHARACTERS.map((c) => [c.id, c]));

/**
 * 相関図のリスト表示を本物の `RelationListItemView` で見せるプレビュー。
 *
 * 拡張サンプル（6 本、ラベル + 色 + メモ違い）を並べることで、ラベル色アクセントと
 * プリセット色の組み合わせの幅を一望できるようにする。
 */
export function RelationListPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {GUIDE_SAMPLE_RELATIONS_FULL.map((r) => {
        const from = characterMap.get(r.fromCharacterId);
        const to = characterMap.get(r.toCharacterId);
        return (
          <RelationListItemView
            key={r.id}
            relation={r}
            fromName={from?.name ?? '？'}
            fromColor={from?.color ?? 'var(--text-muted)'}
            toName={to?.name ?? '？'}
            toColor={to?.color ?? 'var(--text-muted)'}
          />
        );
      })}
    </div>
  );
}
