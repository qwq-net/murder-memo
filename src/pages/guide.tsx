import { InlineCode } from '@/components/guide/parts/InlineCode';
import { KeyValueTable } from '@/components/guide/parts/KeyValueTable';
import { Paragraph } from '@/components/guide/parts/Paragraph';
import { SubFeature } from '@/components/guide/parts/SubFeature';
import { SubList } from '@/components/guide/parts/SubList';
import { TableOfContents } from '@/components/guide/parts/TableOfContents';
import { PreviewFrame } from '@/components/guide/PreviewFrame';
import { FreeMemoPreview } from '@/components/guide/previews/FreeMemoPreview';
import { RelationDiagramPreview } from '@/components/guide/previews/RelationDiagramPreview';
import { TimelinePreview } from '@/components/guide/previews/TimelinePreview';
import { Section } from '@/components/guide/Section';
import { LpLayout } from '@/components/lp/LpLayout';
import { PageHead } from '@/components/seo/pageHead';
import { SITE_NAME, absoluteUrl } from '@/lib/siteMeta';

const GUIDE_TITLE = '使い方ガイド｜マダめもくん';
const GUIDE_DESCRIPTION =
  'マダめもくんの使い方をまとめたページです。3 つのパネル、登場人物、相関図、検索、保存などの操作を順番に紹介します。';

const GUIDE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '使い方ガイド',
  description: GUIDE_DESCRIPTION,
  inLanguage: 'ja',
  url: absoluteUrl('/guide'),
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
  },
};

/** 目次に並べるセクション一覧（id は各 Section の id と揃える） */
const TOC_ITEMS = [
  { id: 'panels', label: '3 つのパネル' },
  { id: 'entries', label: 'エントリの基本' },
  { id: 'timeline', label: 'タイムライン固有' },
  { id: 'image', label: '画像メモ' },
  { id: 'groups', label: 'グループ管理' },
  { id: 'characters', label: '登場人物' },
  { id: 'relations', label: '相関図' },
  { id: 'deduction', label: '人物推理メモ' },
  { id: 'search-link', label: '検索とリンク' },
  { id: 'operations', label: '操作・データ管理' },
];

/**
 * `/guide` 使い方ガイドページ。
 *
 * SSG プリレンダ対象。LP と同じ `LpLayout` でヘッダー / フッターを統一する。
 * 文体は事実ベースで淡々と。装飾語禁止。
 *
 * 構成は [計画](https://memo.qwqb.net/) の `humble-tinkering-galaxy.md` に従う:
 *   フェーズ A: 骨格拡張（このコミット）— 10 セクション構造 + 既存 4 プレビューの再利用
 *   フェーズ B: 既存 View で作れる新規プレビュー追加
 *   フェーズ C: 追加 View 抽出（リファクタ）
 *   フェーズ D: 抽出 View を使った残りプレビュー実装
 *   フェーズ E: 仕上げ
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
export default function GuidePage() {
  return (
    <>
      <PageHead
        title={GUIDE_TITLE}
        description={GUIDE_DESCRIPTION}
        path="/guide"
        jsonLd={GUIDE_JSON_LD}
      />
      <LpLayout>
        <article
          style={{
            maxWidth: 820,
            margin: '0 auto',
            padding: '32px 24px 64px',
          }}
        >
          {/* ── ページヘッダー ───────────────────────────────────────── */}
          <header style={{ marginBottom: 8 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              使い方ガイド
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: '12px 0 0',
              }}
            >
              マダめもくんの各機能を、画面別 / 操作別にまとめたページです。
              実際の操作感はアプリ内のサンプルシナリオでも確認できます。
            </p>
          </header>

          <TableOfContents items={TOC_ITEMS} />

          {/* ── §1 3 つのパネル ─────────────────────────────────────── */}
          <Section id="panels" title="3 つのパネル">
            <Paragraph>
              アプリ画面はデスクトップで横並び 3 列、モバイルではタブ切替で表示されます。
              各パネルは独立しており、書いたメモは他のパネルに自動では引き継がれません。
              並び順はアプリ設定から変更できます。
            </Paragraph>

            <SubFeature title="タイムライン">
              <Paragraph>
                時刻つきで出来事や証言を並べるパネルです。証言の食い違いやアリバイの矛盾を見つけるための土台になります。
              </Paragraph>
            </SubFeature>

            <SubFeature title="フリーメモ">
              <Paragraph>
                事実・証拠・キーアイテムなど、卓内で共有したい情報をまとめるパネルです。
              </Paragraph>
            </SubFeature>

            <SubFeature title="自分用メモ">
              <Paragraph>
                自分だけが見るメモを書くパネルです。仮説や疑念など、卓内で共有したくない情報を分けて管理します。
              </Paragraph>
            </SubFeature>
          </Section>

          {/* ── §2 エントリの基本 ───────────────────────────────────── */}
          <Section id="entries" title="エントリの基本">
            <Paragraph>
              各パネルの 1 行を「エントリ」と呼びます。エントリには重要度や関連人物などを設定でき、
              テキスト・時刻つき・画像・手がかりカードといった内容を持てます。
            </Paragraph>

            <SubFeature title="サンプル">
              <Paragraph>
                フリーメモのカード 2 件を、アプリ本体と同じ描画でそのまま表示します。
              </Paragraph>
              <PreviewFrame>
                <FreeMemoPreview />
              </PreviewFrame>
            </SubFeature>

            <SubFeature title="操作">
              <KeyValueTable
                rows={[
                  { key: 'クリック', value: '編集モードに入ります' },
                  { key: 'Shift + クリック', value: '範囲選択 / 追加選択' },
                  { key: 'ドラッグ', value: '並び替え' },
                  {
                    key: '右クリック',
                    value: 'コンテキストメニュー（複製 / 重要度 / タグ / 削除）',
                  },
                ]}
              />
            </SubFeature>

            <SubFeature title="重要度">
              <Paragraph>
                エントリには重要度（低 / 中 / 高）を設定できます。重要度を設定すると、
                カード右側に色付きアイコンが表示され、背景に薄いグラデーションがかかります。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>
          </Section>

          {/* ── §3 タイムライン固有 ─────────────────────────────────── */}
          <Section id="timeline" title="タイムライン固有">
            <Paragraph>
              タイムラインパネルでは、時刻つきのエントリを時系列順に並べられます。
              時刻なしのエントリは末尾の「不明」セクションにまとまります。
            </Paragraph>

            <SubFeature title="サンプル">
              <PreviewFrame>
                <TimelinePreview />
              </PreviewFrame>
            </SubFeature>

            <SubFeature title="時刻入力と自動補完">
              <Paragraph>
                時刻欄をクリックすると編集モードに入ります。数字をそのまま続けて入力すると、
                自動でコロンが補われます（例：<InlineCode>1300</InlineCode> →{' '}
                <InlineCode>13:00</InlineCode>、<InlineCode>530</InlineCode> →{' '}
                <InlineCode>5:30</InlineCode>）。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="時間帯セパレータと不明セクション">
              <Paragraph>
                同じ時刻が連続する場合、2 件目以降の時刻ラベルは省略され、見やすく表示されます。
                時刻が未入力のエントリは末尾の「不明」セクションにまとまります。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="2 階層グループ（タイムライングループ）">
              <Paragraph>
                タイムラインは「タイムライングループ」（例：前日 / 当日）でさらに区切れます。
                各グループは折りたたみ可能で、ドラッグで並び替えできます。
              </Paragraph>
            </SubFeature>
          </Section>

          {/* ── §4 画像メモ ────────────────────────────────────────── */}
          <Section id="image" title="画像メモ">
            <Paragraph>
              パネル内で <InlineCode>Ctrl + V</InlineCode>{' '}
              を押すと、クリップボードの画像が画像メモとして貼り付けられます。
              ファイルのドラッグ&ドロップでも受け入れます。
            </Paragraph>
            <Paragraph>
              画像メモは 40×40 のサムネイルとキャプションで表示され、サムネイルをクリックすると
              全画面表示（Lightbox）で拡大できます。キャプションは編集可能で、 キャラクターバッジや{' '}
              <InlineCode>[キーワード]</InlineCode> 記法も同様に使えます。
            </Paragraph>
            <Paragraph>プレビューは準備中です。</Paragraph>
          </Section>

          {/* ── §5 グループ管理 ────────────────────────────────────── */}
          <Section id="groups" title="グループ管理">
            <Paragraph>
              フリーメモと自分用メモは、エントリを「グループ」に分けて整理できます。 タイムラインも
              2 階層のグループ（タイムライングループ → 時刻順）で整理されます。
            </Paragraph>

            <SubFeature title="ヘッダーの操作">
              <KeyValueTable
                rows={[
                  { key: 'クリック（▼）', value: 'グループの折りたたみ / 展開' },
                  { key: 'ラベルクリック', value: '名前の編集' },
                  { key: '↑ / ↓ ボタン', value: '隣のグループと入れ替え' },
                  {
                    key: '✕ ボタン',
                    value: 'グループの削除（メモが残っているときは確認モーダル）',
                  },
                ]}
              />
            </SubFeature>

            <SubFeature title="削除時の挙動">
              <Paragraph>
                フリーメモ /
                自分用メモのグループを削除すると、所属していたメモは「未分類」へ移動して保持されます。
                タイムライングループを削除すると、そのグループ内のエントリも一緒に削除される点に注意してください。
              </Paragraph>
            </SubFeature>

            <SubFeature title="全開 / 全閉">
              <Paragraph>
                パネル右上のアイコン（<InlineCode>▾▴</InlineCode> / <InlineCode>▴▾</InlineCode>
                ）で、 そのパネル内の全グループを一括で展開 / 折りたたみできます。
              </Paragraph>
            </SubFeature>
          </Section>

          {/* ── §6 登場人物 ────────────────────────────────────────── */}
          <Section id="characters" title="登場人物">
            <Paragraph>
              ヘッダーの「登場人物」から PL / NPC を登録できます。
              登録した人物はメモにバッジで紐付けたり、相関図や人物推理メモで参照されます。
            </Paragraph>

            <SubFeature title="登録項目">
              <SubList
                items={[
                  '役割（PL / NPC）',
                  '色（9 色パレットから選択。インライン色付けに使われる）',
                  '行動順（PL/NPC それぞれの中での順序）',
                  '表示制御（メモ内のバッジ列に出すかどうかを人物ごとに切替できる）',
                ]}
              />
            </SubFeature>

            <SubFeature title="バッジの表示形式">
              <Paragraph>バッジには 3 つの表示形式があります。</Paragraph>
              <KeyValueTable
                rows={[
                  { key: 'フル', value: '色丸 + 名前' },
                  { key: 'バッジ', value: '色丸のみ（コンパクト）' },
                  { key: 'テキスト', value: '名前のみ（背景色つき）' },
                ]}
              />
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="バッジの表示モード">
              <KeyValueTable
                rows={[
                  { key: '常時', value: '常に表示' },
                  {
                    key: 'ミニマル',
                    value: '紐付け済みのバッジだけ常時表示。カードにマウスを乗せると全表示',
                  },
                  { key: 'オフ', value: '完全に非表示' },
                ]}
              />
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="パネル別デフォルトと個別上書き">
              <Paragraph>
                アプリ設定で、パネルごとに「デフォルトの表示形式 / 表示モード」を設定できます。
                個別のエントリでこの設定を上書きすることもできます（コンテキストメニューから）。
              </Paragraph>
            </SubFeature>

            <SubFeature title="サンプル">
              <Paragraph>登場人物管理画面とバッジ表示のプレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="本文中のインライン色付け">
              <Paragraph>
                メモ本文に登場人物の名前を書くと、自動でその人物の色で太字表示されます。
                同じ名前が複数いる場合は、長い名前から優先してマッチします。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>
          </Section>

          {/* ── §7 相関図 ──────────────────────────────────────────── */}
          <Section id="relations" title="相関図">
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
                よく使う関係性ラベル（友人 / 恋人 / 家族 / 上司部下 / 敵対 / 協力者 / 知人 /
                不明）がプリセットとして用意されており、それぞれ既定の色が設定されています。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="ズーム / パン">
              <Paragraph>
                マウスホイールで 0.5 倍〜3 倍までズーム、左ドラッグでパンできます。
                右上の「リセット」ボタンで等倍 / 中央位置に戻ります。
              </Paragraph>
            </SubFeature>
          </Section>

          {/* ── §8 人物推理メモ ────────────────────────────────────── */}
          <Section id="deduction" title="人物推理メモ">
            <Paragraph>
              ヘッダーの「人物推理メモ」から、登場人物ごとに疑惑度（★
              0〜3）と個別メモを記録できます。
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
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="PL / NPC 区分">
              <Paragraph>
                推理メモは PL と NPC で別セクションに分けて表示されます。 犯人候補が PL / NPC
                双方にいるシナリオでも見やすく整理できます。
              </Paragraph>
            </SubFeature>
          </Section>

          {/* ── §9 検索とリンク ────────────────────────────────────── */}
          <Section id="search-link" title="検索とリンク">
            <Paragraph>
              ヘッダーの「検索」から、タイムライン・フリーメモ・自分用メモを横断してキーワード検索できます。
              検索結果はパネル別にグループ化され、マッチ箇所がハイライト表示されます。
            </Paragraph>

            <SubFeature title="横断検索">
              <Paragraph>
                <InlineCode>Ctrl + F</InlineCode> でも開けます。最大 50
                件まで表示され、各結果をクリックすると該当メモに飛びます。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="[キーワード] 記法と自動辞書">
              <Paragraph>
                メモ本文に <InlineCode>[キーワード]</InlineCode>{' '}
                と書くと、その箇所が検索リンク（青字 + 破線下線）として描画されます。
                クリックすると検索パレットがそのキーワードで開きます。
              </Paragraph>
              <Paragraph>
                確定したキーワードは自動的にリンク辞書に登録され、以降のメモでブラケットなしで書いても
                自動的にリンク化されます。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>

            <SubFeature title="リンク一覧">
              <Paragraph>
                ヘッダーの「リンク一覧」を開くと、登録済みキーワードがリスト表示されます。
                各キーワードをクリックするとそのキーワードで検索が起動します。不要なキーワードは削除できます。
              </Paragraph>
              <Paragraph>プレビューは準備中です。</Paragraph>
            </SubFeature>
          </Section>

          {/* ── §10 操作・データ管理 ──────────────────────────────── */}
          <Section id="operations" title="操作・データ管理">
            <SubFeature title="Undo / Redo">
              <Paragraph>
                メモ・登場人物・推理メモ・相関図の変更は履歴に記録されます。
                <InlineCode>Ctrl + Z</InlineCode> で取り消し、
                <InlineCode>Ctrl + Shift + Z</InlineCode>{' '}
                でやり直しができます。セッションを切り替えると履歴はリセットされます。
              </Paragraph>
            </SubFeature>

            <SubFeature title="キーボードショートカット">
              <KeyValueTable
                rows={[
                  { key: 'Ctrl + Z', keyAsCode: true, value: '直前の操作を取り消す' },
                  { key: 'Ctrl + Shift + Z', keyAsCode: true, value: 'やり直す' },
                  { key: 'Ctrl + V', keyAsCode: true, value: '画像メモを貼り付ける（パネル内）' },
                  { key: 'Ctrl + F', keyAsCode: true, value: '横断検索を開く' },
                  { key: 'Esc', keyAsCode: true, value: '編集確定 / モーダルを閉じる' },
                  { key: 'Enter', keyAsCode: true, value: '時刻欄からテキスト欄へフォーカス移動' },
                  { key: 'Shift + Enter', keyAsCode: true, value: '本文中で改行' },
                  { key: 'Shift + クリック', value: 'エントリを範囲 / 追加選択' },
                ]}
              />
            </SubFeature>

            <SubFeature title="エクスポート / インポート">
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

            <SubFeature title="セッション管理">
              <Paragraph>
                ヘッダー左のセッションメニューから、シナリオごとに独立したセッションを管理できます。
              </Paragraph>
              <KeyValueTable
                rows={[
                  { key: 'セッション切替', value: '直近に開いていたセッションを自動復元します' },
                  { key: '新規作成（+）', value: '空のセッションを作成します' },
                  { key: '名前変更', value: 'セッション名をその場で編集できます' },
                  { key: '複製', value: '既存セッションを丸ごとコピーします' },
                  {
                    key: '削除',
                    value: '複数セッションがある場合のみ可能（最後の 1 件は削除できません）',
                  },
                  {
                    key: '初期化',
                    value: 'メモ / 登場人物 / 画像をクリア。セッション自体は残します',
                  },
                  { key: '完全リセット', value: '全セッション / 設定 / IndexedDB を初期化します' },
                ]}
              />
            </SubFeature>

            <SubFeature title="アプリ設定">
              <Paragraph>
                ヘッダー右の「アプリ設定」から、表示や入力の挙動を調整できます。
              </Paragraph>
              <KeyValueTable
                rows={[
                  { key: 'テーマ', value: 'auto（OS 設定追従）/ dark / light' },
                  {
                    key: 'パネル並び順',
                    value: 'タイムライン / フリーメモ / 自分用メモを並び替え',
                  },
                  { key: '入力欄の位置', value: 'パネルの上 / 下を切り替え' },
                  {
                    key: '関連人物マーカー',
                    value:
                      'パネル別に「表示形式（full/badge/text）× 表示モード（always/minimal/off）」のデフォルトを設定',
                  },
                ]}
              />
            </SubFeature>

            <SubFeature title="初回体験">
              <Paragraph>
                初回起動 / バージョン更新後の起動時に「ようこそ」モーダルが表示され、
                サンプルシナリオが入った状態でアプリが開きます。
                サンプルはアプリのバージョンが上がるごとに更新されるので、新機能を反映した状態で見られます。
              </Paragraph>
            </SubFeature>
          </Section>
        </article>
      </LpLayout>
    </>
  );
}

export const Component = GuidePage;
