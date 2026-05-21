import {
  GUIDE_SAMPLE_CHARACTERS,
  GUIDE_SAMPLE_RELATIONS,
} from '@/components/guide/previews/sampleData';
import { RelationDiagramSvgView } from '@/components/relations/relationDiagramSvgView';

/**
 * Guide 用相関図プレビュー。
 *
 * 本体の `RelationDiagramSvgView` をそのまま使い、`sampleData.ts` の関係線で
 * 円周配置 / ノード描画 / ラベル付きエッジを表示する。ズーム / パン UI は付けない。
 */
export function RelationDiagramPreview() {
  return (
    <RelationDiagramSvgView
      characters={GUIDE_SAMPLE_CHARACTERS}
      relations={GUIDE_SAMPLE_RELATIONS}
    />
  );
}
