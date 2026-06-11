/**
 * 使い方ガイドのセクション定義（リファレンス編：エクスポートとデータ管理 / ショートカット・設定リファレンス）。
 *
 * content の JSX はガイドページ（guide.tsx）の Section の中身をそのまま移したもの。
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
import { InlineCode } from '@/components/guide/parts/InlineCode';
import { KeyValueTable } from '@/components/guide/parts/KeyValueTable';
import { Paragraph } from '@/components/guide/parts/Paragraph';
import { SubFeature } from '@/components/guide/parts/SubFeature';
import type { GuideSection } from './types';

export const referenceSections: GuideSection[] = [
  // ── §13 エクスポートとデータ管理 ──────────────────────────
  {
    id: 'export',
    title: 'エクスポートとデータ管理',
    content: (
      <>
        <Paragraph>
          セッション全体のデータをファイルに書き出したり、別アプリへテキストで貼り付けたりできます。
          データの保存先や、オフライン利用についてもここでまとめます。
        </Paragraph>

        <SubFeature title="エクスポート / インポート（JSON）">
          <Paragraph>
            アプリ設定の「バックアップ」から、セッション全データを JSON ファイルに書き出せます。
            同じ画面から読み込めるので、PC 間の移行やバージョン更新前のバックアップに使えます。
          </Paragraph>
        </SubFeature>

        <SubFeature title="テキストエクスポート">
          <Paragraph>
            同じ「バックアップ」画面から、全パネル or 指定パネルのメモを Markdown
            形式でクリップボードに書き出せます。 別アプリへ貼り付けて使えます。
          </Paragraph>
        </SubFeature>

        <SubFeature title="データの保存先">
          <Paragraph>
            メモは端末のブラウザに組み込まれた IndexedDB
            （オフラインデータベース）に保存されます。サーバーには送信されないため、利用にあたって
            アカウント登録は不要です。
          </Paragraph>
          <Paragraph>
            ブラウザのキャッシュ / サイトデータを削除するとメモも消えます。重要なデータは事前に
            エクスポートしておいてください。
          </Paragraph>
        </SubFeature>

        <SubFeature title="PWA / オフライン">
          <Paragraph>
            マダめもくんは PWA に対応しているので、Chrome 等のインストールからホーム画面 /
            アプリケーション一覧に追加できます。一度開いたあとはオフラインでも起動できます。
          </Paragraph>
        </SubFeature>
      </>
    ),
  },
  // ── §14 ショートカット・設定リファレンス ────────────────
  {
    id: 'reference',
    title: 'ショートカット・設定リファレンス',
    content: (
      <>
        <SubFeature title="Undo / Redo">
          <Paragraph>
            メモ・登場人物・推理メモ・相関図の変更は履歴に記録されます。
            <InlineCode>Ctrl + Z</InlineCode> で取り消し、
            <InlineCode>Ctrl + Shift + Z</InlineCode>{' '}
            でやり直しができます。セッションを切り替えると履歴はリセットされます。
          </Paragraph>
          <Paragraph>
            メモの入力欄にフォーカスしている間の <InlineCode>Ctrl + Z</InlineCode>{' '}
            は、その入力欄の文字入力の取り消しとして扱われます。メモ自体を取り消すときは、
            入力欄の外をクリックしてから押してください。
          </Paragraph>
        </SubFeature>

        <SubFeature title="キーボードショートカット">
          <KeyValueTable
            rows={[
              { key: 'Ctrl + Z', keyAsCode: true, value: '直前の操作を取り消す' },
              {
                key: 'Ctrl + Shift + Z',
                keyAsCode: true,
                value: 'やり直す（Ctrl + Y も可）',
              },
              {
                key: 'Ctrl + V',
                keyAsCode: true,
                value: 'クリップボードの画像をフリーメモに画像メモとして貼り付け（複数枚も可）',
              },
              {
                key: 'Esc',
                keyAsCode: true,
                value: '編集をキャンセル（変更を破棄）/ モーダルを閉じる',
              },
              {
                key: 'Enter',
                keyAsCode: true,
                value: '時刻欄からテキスト欄へフォーカス移動',
              },
              { key: 'Shift + Enter', keyAsCode: true, value: '本文中で改行' },
              { key: 'Shift + クリック', value: 'エントリを範囲 / 追加選択' },
            ]}
          />
        </SubFeature>

        <SubFeature title="アプリ設定">
          <Paragraph>ヘッダー右の「アプリ設定」から、表示や入力の挙動を調整できます。</Paragraph>
          <KeyValueTable
            rows={[
              {
                key: '言語',
                value: '日本語のみ対応（English は未実装 / WIP）',
              },
              { key: 'テーマ', value: '自動（OS 設定追従）/ ダーク / ライト' },
              {
                key: 'パネル並び順',
                value: 'フリーメモ / 自分用メモ / タイムラインを並び替え',
              },
              { key: '入力欄の位置', value: 'パネルの上 / 下を切り替え' },
              {
                key: '関連人物マーカー',
                value:
                  'パネル別に「表示形式（フル / バッジ / テキスト）× 表示モード（常時 / ミニマル / オフ）」のデフォルトを設定',
              },
            ]}
          />
        </SubFeature>
      </>
    ),
  },
];
