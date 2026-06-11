/**
 * 使い方ガイドのセクション定義（推理編：検索とリンク / 相関図 / 人物推理メモ）。
 *
 * content の JSX はガイドページ（guide.tsx）の Section の中身をそのまま移したもの。
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
import { InlineCode } from '@/components/guide/parts/InlineCode';
import { KeyValueTable } from '@/components/guide/parts/KeyValueTable';
import { Paragraph } from '@/components/guide/parts/Paragraph';
import { SubFeature } from '@/components/guide/parts/SubFeature';
import { SubList } from '@/components/guide/parts/SubList';
import { PreviewFrame } from '@/components/guide/PreviewFrame';
import { DeductionRowsPreview } from '@/components/guide/previews/DeductionRowsPreview';
import { LinkListPreview } from '@/components/guide/previews/LinkListPreview';
import { LinkSyntaxPreview } from '@/components/guide/previews/LinkSyntaxPreview';
import { RelationDiagramPreview } from '@/components/guide/previews/RelationDiagramPreview';
import { RelationListPreview } from '@/components/guide/previews/RelationListPreview';
import { RelationPresetChipsPreview } from '@/components/guide/previews/RelationPresetChipsPreview';
import { SearchOverlayPreview } from '@/components/guide/previews/SearchOverlayPreview';
import type { GuideSection } from './types';

export const researchSections: GuideSection[] = [
  // ── §10 検索とリンク ──────────────────────────────────────
  {
    id: 'search-link',
    title: '検索とリンク',
    content: (
      <>
        <Paragraph>
          ヘッダーの「検索」から、タイムライン・フリーメモ・自分用メモを横断してキーワード検索できます。
          検索結果はパネル別にグループ化され、マッチ箇所がハイライト表示されます。
        </Paragraph>

        <SubFeature title="横断検索">
          <Paragraph>
            検索結果は最大 50 件まで表示され、各結果をクリックすると該当メモに飛びます。
            検索対象はメモ本文に加え、タグ付けした登場人物の名前・所属グループ名も含みます
            （画像メモのキャプションは対象外）。本文以外で一致した場合は、結果に一致理由
            （人物名やグループ名）がチップで添えられます。
          </Paragraph>
          <Paragraph>
            スペースで区切って複数のキーワードを入れると、そのすべてを含むメモだけに
            絞り込めます（AND 検索）。各キーワードは本文・人物名・グループ名のいずれかに
            当てはまれば一致とみなされます。
          </Paragraph>
          <PreviewFrame>
            <SearchOverlayPreview />
          </PreviewFrame>
        </SubFeature>

        <SubFeature title="[キーワード] 記法と自動辞書">
          {/* {' '} とテキストを別ノードのまま保ち、SSR 出力（テキストノード区切り）を変えないため整形除外 */}
          {/* prettier-ignore */}
          <Paragraph>
            メモ本文に <InlineCode>[キーワード]</InlineCode>{' '}
            と書くと、その箇所が検索リンク（青字 + 破線下線）として描画されます。
            クリックすると検索パレットがそのキーワードで開きます。
          </Paragraph>
          <Paragraph>
            確定したキーワードは自動的にリンク辞書に登録され、以降のメモでブラケットなしで書いても
            自動的にリンク化されます。
          </Paragraph>
          <PreviewFrame>
            <LinkSyntaxPreview />
          </PreviewFrame>
        </SubFeature>

        <SubFeature title="リンク一覧">
          <Paragraph>
            ヘッダーの「リンク一覧」を開くと、登録済みキーワードがリスト表示されます。
            各キーワードをクリックするとそのキーワードで検索が起動します。不要なキーワードは削除できます。
          </Paragraph>
          <PreviewFrame>
            <LinkListPreview />
          </PreviewFrame>
        </SubFeature>
      </>
    ),
  },
  // ── §11 相関図 ────────────────────────────────────────────
  {
    id: 'relations',
    title: '相関図',
    content: (
      <>
        <Paragraph>
          登録した登場人物どうしを関係線で結ぶ機能です。 線の色やラベルで関係性（友人 / 敵対 /
          取引相手など）を表現できます。
        </Paragraph>

        <SubFeature title="サンプル">
          <PreviewFrame>
            <RelationDiagramPreview />
          </PreviewFrame>
        </SubFeature>

        <SubFeature title="関係の構造">
          <SubList
            items={[
              'from → to の方向を持つ（描画は無向だが、内部的に始点 / 終点を持つ）',
              'ラベル（例：友人 / 敵対 / 取引相手）',
              'エッジ色（任意。プリセットから選ぶか、ラベルごとに自動）',
              'メモ（任意。関係性の補足）',
            ]}
          />
        </SubFeature>

        <SubFeature title="ラベルプリセット">
          <Paragraph>
            よく使う関係性ラベルがプリセットとして用意されており、それぞれ既定の色が設定されています。
            編集 UI ではこれらをワンクリックで選べます。
          </Paragraph>
          <PreviewFrame>
            <RelationPresetChipsPreview />
          </PreviewFrame>
        </SubFeature>

        <SubFeature title="ズーム / パン">
          <Paragraph>
            マウスホイールで 0.5 倍〜3 倍までズーム、左ドラッグでパンできます。
            右上の「リセット」ボタンで等倍 / 中央位置に戻ります。
            なお図（ダイアグラム）ビューはデスクトップのみで、モバイルではリスト表示になります。
          </Paragraph>
        </SubFeature>

        <SubFeature title="リスト表示">
          <Paragraph>
            相関図モーダルでは、関係性の一覧をリスト形式で追加・削除できます。 各行は from /
            ラベル（左に色アクセント）/ to で構成されます。
            既存の関係の編集（ラベル・色・方向の変更）は
            できないため、変更したいときは一度削除して追加し直します。
          </Paragraph>
          <PreviewFrame>
            <RelationListPreview />
          </PreviewFrame>
        </SubFeature>
      </>
    ),
  },
  // ── §12 人物推理メモ ──────────────────────────────────────
  {
    id: 'deduction',
    title: '人物推理メモ',
    content: (
      <>
        <Paragraph>
          ヘッダーの「人物推理メモ」から、登場人物ごとに疑惑度（★ 0〜3）と個別メモを記録できます。
          最終議論前の頭の整理や、議論中の疑惑度の変化を残すのに使えます。
        </Paragraph>

        <SubFeature title="疑惑度（★ 0〜3）">
          <KeyValueTable
            rows={[
              { key: '★ 0', value: '未設定 / 疑っていない' },
              { key: '★ 1', value: '軽い疑惑（低の色）' },
              { key: '★ 2', value: '中程度の疑惑（中の色）' },
              { key: '★ 3', value: '強い疑惑（高の色）' },
            ]}
          />
          <PreviewFrame>
            <DeductionRowsPreview />
          </PreviewFrame>
        </SubFeature>

        <SubFeature title="PL / NPC 区分">
          <Paragraph>
            推理メモは PL と NPC で別セクションに分けて表示されます。 犯人候補が PL / NPC
            双方にいるシナリオでも見やすく整理できます。
          </Paragraph>
        </SubFeature>
      </>
    ),
  },
];
