import { InlineCode } from '@/components/guide/parts/InlineCode';
import { KeyValueTable } from '@/components/guide/parts/KeyValueTable';
import { Paragraph } from '@/components/guide/parts/Paragraph';
import { SubFeature } from '@/components/guide/parts/SubFeature';
import { SubList } from '@/components/guide/parts/SubList';
import { TableOfContents } from '@/components/guide/parts/TableOfContents';
import { PreviewFrame } from '@/components/guide/PreviewFrame';
import { ActionOrderStepperPreview } from '@/components/guide/previews/ActionOrderStepperPreview';
import { BadgeFormatPreview } from '@/components/guide/previews/BadgeFormatPreview';
import { BadgeVisibilityPreview } from '@/components/guide/previews/BadgeVisibilityPreview';
import { CharacterFilterBarPreview } from '@/components/guide/previews/CharacterFilterBarPreview';
import { CharacterRowsPreview } from '@/components/guide/previews/CharacterRowsPreview';
import { DeductionRowsPreview } from '@/components/guide/previews/DeductionRowsPreview';
import { EntryInputPreview } from '@/components/guide/previews/EntryInputPreview';
import { EntryStatesPreview } from '@/components/guide/previews/EntryStatesPreview';
import { FreeMemoPreview } from '@/components/guide/previews/FreeMemoPreview';
import { GroupHeaderStatesPreview } from '@/components/guide/previews/GroupHeaderStatesPreview';
import { ImageEntryPreview } from '@/components/guide/previews/ImageEntryPreview';
import { ImportanceFilterBarPreview } from '@/components/guide/previews/ImportanceFilterBarPreview';
import { ImportanceVariantsPreview } from '@/components/guide/previews/ImportanceVariantsPreview';
import { InlineCharacterPreview } from '@/components/guide/previews/InlineCharacterPreview';
import { LinkListPreview } from '@/components/guide/previews/LinkListPreview';
import { LinkSyntaxPreview } from '@/components/guide/previews/LinkSyntaxPreview';
import { RelationDiagramPreview } from '@/components/guide/previews/RelationDiagramPreview';
import { RelationListPreview } from '@/components/guide/previews/RelationListPreview';
import { RelationPresetChipsPreview } from '@/components/guide/previews/RelationPresetChipsPreview';
import { SearchOverlayPreview } from '@/components/guide/previews/SearchOverlayPreview';
import { TimelineHourGroupsPreview } from '@/components/guide/previews/TimelineHourGroupsPreview';
import { TimelineMarkerPreview } from '@/components/guide/previews/TimelineMarkerPreview';
import { TimelinePreview } from '@/components/guide/previews/TimelinePreview';
import { Section } from '@/components/guide/Section';
import { LpLayout } from '@/components/lp/LpLayout';
import { PageHead } from '@/components/seo/pageHead';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SITE_NAME, absoluteUrl } from '@/lib/siteMeta';

const GUIDE_TITLE = '使い方ガイド｜マダめもくん';
const GUIDE_DESCRIPTION =
  'マダめもくんの使い方をまとめたページです。セッション作成から登場人物登録、メモ取り、推理、エクスポートまで一連の流れに沿って機能を紹介します。';

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
  { id: 'intro', label: 'はじめに' },
  { id: 'sessions', label: 'セッションを作る' },
  { id: 'characters', label: '登場人物を登録する' },
  { id: 'panels', label: '3 つのパネル' },
  { id: 'entries', label: 'エントリの基本' },
  { id: 'timeline', label: 'タイムライン' },
  { id: 'image', label: '画像メモ' },
  { id: 'groups', label: 'グループ管理' },
  { id: 'badges', label: '登場人物バッジ' },
  { id: 'search-link', label: '検索とリンク' },
  { id: 'relations', label: '相関図' },
  { id: 'deduction', label: '人物推理メモ' },
  { id: 'export', label: 'エクスポートとデータ管理' },
  { id: 'reference', label: 'ショートカット・設定リファレンス' },
];

/** useActiveSection に渡す ID 配列（モジュールスコープで安定参照にする） */
const TOC_IDS = TOC_ITEMS.map((item) => item.id);

/**
 * `/guide` 使い方ガイドページ。
 *
 * SSG プリレンダ対象。LP と同じ `LpLayout` でヘッダー / フッターを統一する。
 * 文体は事実ベースで淡々と。装飾語禁止。
 *
 * 構成は「利用フロー順」に再編：はじめに → セッション → 登場人物 → パネル → エントリ →
 * （メモ取り系） → 推理系 → エクスポート → リファレンスの 14 セクション。
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
export default function GuidePage() {
  // スクロール位置に応じてサイド目次をハイライト
  const activeId = useActiveSection(TOC_IDS);

  return (
    <>
      <PageHead
        title={GUIDE_TITLE}
        description={GUIDE_DESCRIPTION}
        path="/guide"
        jsonLd={GUIDE_JSON_LD}
      />
      <LpLayout>
        <div
          className="mx-auto grid w-full gap-8 px-6 py-8 md:grid-cols-[200px_minmax(0,1fr)]"
          style={{ maxWidth: 1100 }}
        >
          {/* ── サイド目次（デスクトップ幅のみ。スクロール追従） ─── */}
          <aside
            className="hidden md:block"
            style={{
              position: 'sticky',
              top: 'calc(var(--header-h) + 24px)',
              alignSelf: 'start',
              maxHeight: 'calc(100vh - var(--header-h) - 48px)',
              overflowY: 'auto',
            }}
          >
            <TableOfContents items={TOC_ITEMS} activeId={activeId} />
          </aside>

          <article style={{ minWidth: 0 }}>
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
                マダめもくんを最初から最後まで通して使う流れに沿って、機能を紹介します。
                すでに使っている方は左の目次から目的の項目に飛んでください。
                実際の操作感はアプリ内のサンプルシナリオでも確認できます。
              </p>
            </header>

            {/* モバイル時のみ本文上部に目次を表示 */}
            <div className="md:hidden" style={{ marginTop: 16 }}>
              <TableOfContents items={TOC_ITEMS} activeId={activeId} />
            </div>

            {/* ── §1 はじめに ─────────────────────────────────────────── */}
            <Section id="intro" title="はじめに">
              <Paragraph>
                マダめもくんは、マーダーミステリーをプレイ中にメモを取るためのアプリです。
                証言・証拠・タイムライン・人物関係を整理しておくことで、最終議論や推理の土台になります。
                データはすべて端末のブラウザに保存され、サーバーには送信されません。
              </Paragraph>

              <SubFeature title="このガイドで使う用語">
                <KeyValueTable
                  rows={[
                    {
                      key: 'エントリ / メモ',
                      value:
                        '各パネルの 1 行（カード）のこと。本ガイドでは文脈に応じて両方の呼称を使います',
                    },
                    {
                      key: 'グループ',
                      value: 'フリーメモ / 自分用メモを整理する分類単位',
                    },
                    {
                      key: 'タイムライングループ',
                      value: 'タイムラインの大分類（例：前日 / 当日）',
                    },
                    {
                      key: 'PL / NPC',
                      value:
                        'PL = プレイヤー（参加者が演じるキャラ）、NPC = ノンプレイヤーキャラクター（GM 管理 / 既登場の関係者）',
                    },
                    {
                      key: 'バッジ',
                      value: 'メモの端に表示される登場人物の見た目（色丸・名前・テキスト形式）',
                    },
                    {
                      key: '役職マーカー',
                      value:
                        'コンテキストメニュー上のラベル。「役職マーカー追加」でバッジの紐付け、「役職マーカー設定」で表示形式・モードを上書き',
                    },
                    {
                      key: '関連人物マーカー',
                      value: 'アプリ設定上のラベル。パネル別のバッジ表示形式・モードのデフォルト値',
                    },
                  ]}
                />
              </SubFeature>

              <SubFeature title="サンプルシナリオで試す">
                <Paragraph>
                  初回起動時 / バージョン更新後の起動時には「ようこそ」モーダルが表示され、
                  サンプルシナリオが入った状態でアプリが開きます。
                  実際にプレイする前に、サンプルで操作感を確かめることをおすすめします。
                </Paragraph>
                <Paragraph>
                  サンプルはアプリのバージョンが上がるごとに更新されるので、
                  新機能を反映した状態で確認できます。「ようこそ」モーダルからは、このガイドを別タブで開くリンクも用意されています。
                </Paragraph>
                <Paragraph>
                  自分のシナリオでプレイするには、ヘッダー左の「＋」から新規セッションを作成します。
                </Paragraph>
              </SubFeature>

              <SubFeature title="このガイドの読み方">
                <Paragraph>
                  上から順に読めば、セッション作成 → 登場人物登録 → メモ取り → 推理 →
                  エクスポートまでを一通り辿れる構成になっています。
                  特定の操作を知りたいときは左の目次（モバイルでは本文上部）から該当セクションに直接ジャンプしてください。
                </Paragraph>
              </SubFeature>
            </Section>

            {/* ── §2 セッションを作る ─────────────────────────────────── */}
            <Section id="sessions" title="セッションを作る">
              <Paragraph>
                セッションは、シナリオ単位で独立した作業領域です。シナリオごとにセッションを分けると、
                登場人物・メモ・相関図・推理メモがそれぞれ独立して保管されます。
              </Paragraph>

              <SubFeature title="基本操作">
                <KeyValueTable
                  rows={[
                    { key: 'セッション切替', value: '直近に開いていたセッションを自動復元します' },
                    { key: '新規作成（＋）', value: '空のセッションを作成します' },
                    { key: '名前変更', value: 'セッション名をその場で編集できます' },
                  ]}
                />
              </SubFeature>

              <SubFeature title="データの削除粒度">
                <Paragraph>データを消す操作は、粒度の異なる 3 種類が用意されています。</Paragraph>
                <KeyValueTable
                  rows={[
                    {
                      key: '初期化',
                      value:
                        '現在のセッションのメモ / 登場人物 / グループ / 画像を消去。セッション自体は残ります',
                    },
                    {
                      key: 'セッションを削除',
                      value:
                        '現在のセッションそのものを削除。他のセッションは残ります（最後の 1 件は削除できません）',
                    },
                    {
                      key: '完全リセット',
                      value: '全セッション / 設定 / IndexedDB を消去し、アプリを初期状態に戻します',
                    },
                  ]}
                />
              </SubFeature>
            </Section>

            {/* ── §3 登場人物を登録する ──────────────────────────────── */}
            <Section id="characters" title="登場人物を登録する">
              <Paragraph>
                ヘッダーの「登場人物設定」から、シナリオに出てくる PL / NPC を登録します。
                登録した人物はメモにバッジで紐付けたり、相関図や人物推理メモで参照されます。
              </Paragraph>

              <SubFeature title="登録項目">
                <SubList
                  items={[
                    '役割（PL / NPC）',
                    '色（9 色パレットから選択。インライン色付けやバッジに使われる）',
                    '行動順（PL / NPC それぞれの中での順序）',
                    '表示制御（メモ内のバッジ列に出すかどうかを人物ごとに切替できる）',
                  ]}
                />
              </SubFeature>

              <SubFeature title="登場人物管理画面">
                <Paragraph>
                  ヘッダーの「登場人物設定」から開く管理画面の見た目です。色丸クリックで色パレットを
                  開けます（プレビュー上の編集は保存されません）。
                </Paragraph>
                <PreviewFrame>
                  <CharacterRowsPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="本文中のインライン色付け">
                <Paragraph>
                  メモ本文に登場人物の名前を書くと、自動でその人物の色で太字表示されます。
                  同じ名前が複数いる場合は、長い名前から優先してマッチします。
                </Paragraph>
                <PreviewFrame>
                  <InlineCharacterPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="ヘッダーの行動順ステッパー">
                <Paragraph>
                  ヘッダー右側には、登録した登場人物が「PL → セパレータ <InlineCode>|</InlineCode> →
                  NPC」の順で 1 列に並びます。 PL / NPC
                  それぞれの中では「登場人物管理画面」で並べ替えた順序に従い、
                  シナリオ進行中に手番や行動順を俯瞰するためのリファレンスとして使えます。
                </Paragraph>
                <Paragraph>
                  並び順は登場人物管理画面でドラッグして変更できます。
                  ステッパーの表示は登録済みの全人物が対象で、「メモに表示する」のオン /
                  オフとは独立しています。
                </Paragraph>
                <PreviewFrame>
                  <ActionOrderStepperPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="登場人物の削除">
                <Paragraph>
                  登場人物を削除すると、その人物が関わる相関図の関係線・人物推理メモ・各メモに付いた
                  バッジ（タグ）・絞り込みフィルターの選択も一緒に取り除かれます。
                </Paragraph>
              </SubFeature>
            </Section>

            {/* ── §4 3 つのパネル ─────────────────────────────────────── */}
            <Section id="panels" title="3 つのパネル">
              <Paragraph>
                アプリ画面はデスクトップで横並び 3 列、モバイルではタブ切替で表示されます。
                各パネルは独立しており、書いたメモは他のパネルに自動では引き継がれません。
                並び順はアプリ設定から変更できます。
              </Paragraph>

              <SubFeature title="パネル幅の調整（デスクトップ）">
                <Paragraph>
                  デスクトップではパネル間の境界をドラッグして、3 列の幅の比率を自由に変えられます。
                  調整した幅は保持されます（モバイルはタブ切替のため対象外）。
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

              <SubFeature title="タイムライン">
                <Paragraph>
                  時刻つきで出来事や証言を並べるパネルです。証言の食い違いやアリバイの矛盾を見つけるための土台になります。
                </Paragraph>
              </SubFeature>
            </Section>

            {/* ── §5 エントリの基本 ───────────────────────────────────── */}
            <Section id="entries" title="エントリの基本">
              <Paragraph>
                各パネルの 1
                行を「エントリ」と呼びます。エントリには重要度や関連人物などを設定でき、
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

              <SubFeature title="エントリの追加">
                <Paragraph>
                  各パネルには入力欄が固定で表示されており、ここから新しいエントリを追加します。
                  入力欄の位置（パネルの上 / 下）はアプリ設定で切り替えられます。
                </Paragraph>
                <PreviewFrame>
                  <EntryInputPreview />
                </PreviewFrame>
                <KeyValueTable
                  rows={[
                    {
                      key: 'タイムライン',
                      value:
                        '時刻欄 + 本文欄 + 画像追加ボタン。時刻欄では数字の連続入力が自動補完されます',
                    },
                    {
                      key: 'フリーメモ / 自分用メモ',
                      value: 'グループセレクタ + 本文欄 + 画像追加ボタン。所属グループを選んで保存',
                    },
                    {
                      key: 'Enter',
                      keyAsCode: true,
                      value: '入力を確定して新規エントリとして追加',
                    },
                    { key: 'Shift + Enter', keyAsCode: true, value: '本文中で改行' },
                    {
                      key: 'Ctrl + V',
                      keyAsCode: true,
                      value:
                        'クリップボードの画像をフリーメモに画像メモとして貼り付け（複数枚も可）',
                    },
                    {
                      key: 'ドラッグ&ドロップ',
                      value:
                        '画像ファイル（複数可）を各パネルにドロップすると、そのパネルに画像メモとして追加',
                    },
                  ]}
                />
                <Paragraph>
                  タイムラインはグループ（タイムライングループ）が 1
                  つもないと入力欄が無効化されます。 先に「+
                  グループ」から追加してください。フリーメモ / 自分用メモはグループが無くても
                  入力でき、グループ未選択のメモは「未分類」としてまとめられます。
                </Paragraph>
              </SubFeature>

              <SubFeature title="表示状態">
                <Paragraph>
                  エントリは通常 / マウスホバー /
                  選択中で見た目が変わります。背景や左縦線が変化して、
                  どのカードを操作中なのかが分かるようになっています。
                </Paragraph>
                <PreviewFrame>
                  <EntryStatesPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="操作">
                <KeyValueTable
                  rows={[
                    { key: 'クリック', value: '編集モードに入ります' },
                    {
                      key: 'Shift + クリック',
                      value: '範囲選択 / 追加選択。選択済みのカードを Shift + クリックすると解除',
                    },
                    {
                      key: 'ドラッグ',
                      value: '並び替え・移動（下記「ドラッグで並び替え・移動」を参照）',
                    },
                    {
                      key: '右クリック',
                      value: 'コンテキストメニュー（下記）',
                    },
                  ]}
                />
                <Paragraph>右クリックメニューでは以下の操作ができます。</Paragraph>
                <SubList
                  items={[
                    '移動（別パネルへ / 同一パネル内のグループ間）',
                    '重要度（高 / 中 / 低 / 解除）',
                    '役職マーカー設定（表示形式・表示モードを上書き / デフォルトに戻す）',
                    '役職マーカー追加（メモに登場人物を紐付け）',
                    '時刻トグル（タイムラインのみ。時刻を不明にする / 時刻を設定）',
                    '複製（同じ内容のメモを末尾に追加）',
                    '削除',
                  ]}
                />
              </SubFeature>

              <SubFeature title="ドラッグで並び替え・移動">
                <Paragraph>
                  エントリはドラッグして、並び替えだけでなく別のグループや時間帯へ移動できます。
                  ドラッグ中は、落とせる場所にカーソルを重ねるとその範囲が薄く色づきます。
                </Paragraph>
                <SubList
                  items={[
                    '同じグループ・時間帯の中：ドラッグして順序を入れ替えます',
                    'メモグループ間：フリーメモ / 自分用メモで、別のグループや「未分類」へ落とすとそのグループへ移動します',
                    'タイムラインの時間帯間：別の時間帯へ落とすと、落とした位置の隣のエントリと同じ時刻を引き継ぎます。「不明」へ落とすと時刻なしになります',
                    'タイムライングループ間：当日 / 前日 などのグループをまたいで移動できます',
                    'パネル間（デスクトップのみ）：フリーメモ / 自分用メモ / タイムラインをまたいで移動できます。モバイルでは右クリック（長押し）メニューの「移動」を使ってください',
                  ]}
                />
                <Paragraph>
                  登場人物フィルターで一部だけを表示しているときは、ドラッグでの移動・並び替えは無効になります
                  （表示されていないエントリと順序が食い違うのを防ぐためです）。
                </Paragraph>
              </SubFeature>

              <SubFeature title="複数選択と一括操作">
                <Paragraph>
                  Shift + クリックで複数のエントリをまとめて選択し、選択中のカードを右クリックすると
                  「一括操作メニュー」が開きます。1 回の操作で選択中すべてを動かせます。
                </Paragraph>
                <KeyValueTable
                  rows={[
                    {
                      key: 'Shift + クリック',
                      value: '範囲選択 / 追加選択。既選択のカードを再度クリックすると解除',
                    },
                    {
                      key: '選択中のカードを右クリック',
                      value: '一括操作メニュー（件数付き）を開く',
                    },
                    { key: 'カード外をクリック', value: '選択を解除' },
                  ]}
                />
                <Paragraph>
                  一括メニューの項目は単体時とほぼ同じです（移動 / 重要度 / 役職マーカー設定 /
                  役職マーカー追加 / 複製 / 削除）。
                </Paragraph>
              </SubFeature>

              <SubFeature title="重要度">
                <Paragraph>
                  エントリには重要度（低 / 中 / 高）を設定できます。重要度を設定すると、
                  カード右側に色付きアイコンが表示され、背景に薄いグラデーションがかかります。
                </Paragraph>
                <PreviewFrame>
                  <ImportanceVariantsPreview />
                </PreviewFrame>
              </SubFeature>
            </Section>

            {/* ── §6 タイムライン ─────────────────────────────────────── */}
            <Section id="timeline" title="タイムライン">
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
                  自動でコロンが補われます。
                </Paragraph>
                <KeyValueTable
                  rows={[
                    { key: '1300', keyAsCode: true, value: '→ 13:00' },
                    { key: '530', keyAsCode: true, value: '→ 5:30' },
                    { key: '9', keyAsCode: true, value: '→ 9:00' },
                    { key: '130', keyAsCode: true, value: '→ 1:30' },
                  ]}
                />
                <Paragraph>
                  <InlineCode>25:00</InlineCode> や <InlineCode>12:70</InlineCode>{' '}
                  のような範囲外の時刻は保存されません（入力欄が警告表示になります）。
                </Paragraph>
                <Paragraph>
                  時刻欄で <InlineCode>Enter</InlineCode>{' '}
                  を押すと、本文の入力欄にフォーカスが移ります。時刻 → 本文 → 送信 の流れを
                  キーボードだけで完結できます。
                </Paragraph>
              </SubFeature>

              <SubFeature title="タイムラインマーカー">
                <Paragraph>
                  時刻が入力されたタイムラインカードには、左に小さなマーカー（ドット +
                  横線）が描画されます。
                </Paragraph>
                <PreviewFrame>
                  <TimelineMarkerPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="時間帯セパレータと不明セクション">
                <Paragraph>
                  同じ時刻が連続する場合、2 件目以降の時刻ラベルは省略され、見やすく表示されます。
                  時刻が未入力のエントリは末尾の「不明」セクションにまとまります。
                </Paragraph>
                <PreviewFrame>
                  <TimelineHourGroupsPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="2 階層グループ（タイムライングループ）">
                <Paragraph>
                  タイムラインは「タイムライングループ」（例：前日 / 当日）でさらに区切れます。
                  各グループは折りたたみ可能で、ドラッグで並び替えできます。
                </Paragraph>
                <Paragraph>
                  エントリは別の時間帯やタイムライングループへドラッグして移動できます。別の時間帯へ落とすと
                  隣のエントリと同じ時刻を引き継ぎ、「不明」へ落とすと時刻なしになります（§5「ドラッグで並び替え・移動」を参照）。
                </Paragraph>
              </SubFeature>
            </Section>

            {/* ── §7 画像メモ ────────────────────────────────────────── */}
            <Section id="image" title="画像メモ">
              <Paragraph>
                <InlineCode>Ctrl + V</InlineCode>{' '}
                を押すと、クリップボードの画像がフリーメモに画像メモとして貼り付けられます。
                各パネルに画像ファイルをドラッグ&ドロップしても画像メモとして追加できます。
                クリップボード・ドラッグ&ドロップ・画像追加ボタンのいずれも、複数枚をまとめて取り込めます。
              </Paragraph>
              <Paragraph>
                画像メモは 40×40 のサムネイルとキャプションで表示され、サムネイルをクリックすると
                全画面表示で拡大できます。キャプションは編集可能で、 登場人物バッジや{' '}
                <InlineCode>[キーワード]</InlineCode> 記法も同様に使えます。
              </Paragraph>
              <PreviewFrame>
                <ImageEntryPreview />
              </PreviewFrame>
            </Section>

            {/* ── §8 グループ管理 ────────────────────────────────────── */}
            <Section id="groups" title="グループ管理">
              <Paragraph>
                フリーメモと自分用メモは、エントリを「グループ」に分けて整理できます。
                タイムラインも 2 階層のグループ（タイムライングループ → 時刻順）で整理されます。
                エントリはドラッグして別のグループへ移動できます（§5「ドラッグで並び替え・移動」を参照）。
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
                <PreviewFrame>
                  <GroupHeaderStatesPreview />
                </PreviewFrame>
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

            {/* ── §9 登場人物バッジ ──────────────────────────────────── */}
            <Section id="badges" title="登場人物バッジ">
              <Paragraph>
                メモに紐付けた登場人物は、カード端に「バッジ」として表示されます。
                バッジの見せ方は、パネルごとに表示形式と表示モードで調整できます。
              </Paragraph>

              <SubFeature title="バッジの表示形式">
                <Paragraph>バッジには 3 つの表示形式があります。</Paragraph>
                <KeyValueTable
                  rows={[
                    { key: 'フル', value: '色丸 + 名前' },
                    { key: 'バッジ', value: '色丸のみ（コンパクト）' },
                    { key: 'テキスト', value: '名前のみ（背景色つき）' },
                  ]}
                />
                <PreviewFrame>
                  <BadgeFormatPreview />
                </PreviewFrame>
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
                <PreviewFrame>
                  <BadgeVisibilityPreview />
                </PreviewFrame>
              </SubFeature>

              <SubFeature title="パネル別デフォルトと個別上書き">
                <Paragraph>
                  アプリ設定で、パネルごとに「デフォルトの表示形式 / 表示モード」を設定できます。
                  個別のメモで、コンテキストメニューの「役職マーカー設定」から
                  表示形式・表示モードの両方を上書きできます。
                  「デフォルトに戻す」を選ぶと、そのメモだけパネル設定に従う状態に戻ります。
                </Paragraph>
              </SubFeature>

              <SubFeature title="役職マーカー追加（メモへの紐付け）">
                <Paragraph>
                  メモを右クリック → 「役職マーカー追加」から、そのメモに登場人物を紐付けられます。
                  紐付けるとカード端のバッジ列にその人物が現れます。
                </Paragraph>
                <Paragraph>
                  紐付け先のパネルの表示モードが「オフ」になっている場合、
                  紐付けても見えなくなってしまうのを避けるため、自動で「ミニマル」に切り替わります。
                </Paragraph>
              </SubFeature>

              <SubFeature title="パネル別の絞り込み">
                <Paragraph>
                  各パネルのヘッダーには登場人物の色丸が並んでおり、クリックすると
                  そのパネル内のメモを該当人物に紐付くものだけに絞り込めます。
                  複数選択も可能で、右端の ✕ で一括クリアできます。
                  絞り込みはパネルごとに独立して保持されます。
                </Paragraph>
                <PreviewFrame>
                  <CharacterFilterBarPreview />
                </PreviewFrame>
                <Paragraph>
                  各パネルの色丸の隣には重要度（高 / 中 / 低）の絞り込みセグメントが並びます。
                  選んだ重要度のメモだけを表示でき（複数選択可）、登場人物フィルターと
                  組み合わせると「この人物の重要な手がかりだけ」をひと目で見直せます。
                </Paragraph>
                <PreviewFrame>
                  <ImportanceFilterBarPreview />
                </PreviewFrame>
              </SubFeature>
            </Section>

            {/* ── §10 検索とリンク ────────────────────────────────────── */}
            <Section id="search-link" title="検索とリンク">
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
            </Section>

            {/* ── §11 相関図 ──────────────────────────────────────────── */}
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
            </Section>

            {/* ── §12 人物推理メモ ────────────────────────────────────── */}
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
            </Section>

            {/* ── §13 エクスポートとデータ管理 ────────────────────────── */}
            <Section id="export" title="エクスポートとデータ管理">
              <Paragraph>
                セッション全体のデータをファイルに書き出したり、別アプリへテキストで貼り付けたりできます。
                データの保存先や、オフライン利用についてもここでまとめます。
              </Paragraph>

              <SubFeature title="エクスポート / インポート（JSON）">
                <Paragraph>
                  アプリ設定の「バックアップ」から、セッション全データを JSON
                  ファイルに書き出せます。 同じ画面から読み込めるので、PC
                  間の移行やバージョン更新前のバックアップに使えます。
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
                  ブラウザのキャッシュ /
                  サイトデータを削除するとメモも消えます。重要なデータは事前に
                  エクスポートしておいてください。
                </Paragraph>
              </SubFeature>

              <SubFeature title="PWA / オフライン">
                <Paragraph>
                  マダめもくんは PWA に対応しているので、Chrome 等のインストールからホーム画面 /
                  アプリケーション一覧に追加できます。一度開いたあとはオフラインでも起動できます。
                </Paragraph>
              </SubFeature>
            </Section>

            {/* ── §14 ショートカット・設定リファレンス ──────────────── */}
            <Section id="reference" title="ショートカット・設定リファレンス">
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
                      value:
                        'クリップボードの画像をフリーメモに画像メモとして貼り付け（複数枚も可）',
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
                <Paragraph>
                  ヘッダー右の「アプリ設定」から、表示や入力の挙動を調整できます。
                </Paragraph>
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
            </Section>
          </article>
        </div>
      </LpLayout>
    </>
  );
}

export const Component = GuidePage;
