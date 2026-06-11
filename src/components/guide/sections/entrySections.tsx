/**
 * 使い方ガイドのセクション定義（エントリ編：エントリの基本 / タイムライン / 画像メモ / グループ管理 / 登場人物バッジ）。
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
import { BadgeFormatPreview } from '@/components/guide/previews/BadgeFormatPreview';
import { BadgeVisibilityPreview } from '@/components/guide/previews/BadgeVisibilityPreview';
import { CharacterFilterBarPreview } from '@/components/guide/previews/CharacterFilterBarPreview';
import { EntryInputPreview } from '@/components/guide/previews/EntryInputPreview';
import { EntryStatesPreview } from '@/components/guide/previews/EntryStatesPreview';
import { FreeMemoPreview } from '@/components/guide/previews/FreeMemoPreview';
import { GroupHeaderStatesPreview } from '@/components/guide/previews/GroupHeaderStatesPreview';
import { ImageEntryPreview } from '@/components/guide/previews/ImageEntryPreview';
import { ImportanceFilterBarPreview } from '@/components/guide/previews/ImportanceFilterBarPreview';
import { ImportanceVariantsPreview } from '@/components/guide/previews/ImportanceVariantsPreview';
import { TimelineHourGroupsPreview } from '@/components/guide/previews/TimelineHourGroupsPreview';
import { TimelineMarkerPreview } from '@/components/guide/previews/TimelineMarkerPreview';
import { TimelinePreview } from '@/components/guide/previews/TimelinePreview';
import type { GuideSection } from './types';

export const entrySections: GuideSection[] = [
  // ── §5 エントリの基本 ─────────────────────────────────────
  {
    id: 'entries',
    title: 'エントリの基本',
    content: (
      <>
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
                value: 'クリップボードの画像をフリーメモに画像メモとして貼り付け（複数枚も可）',
              },
              {
                key: 'ドラッグ&ドロップ',
                value:
                  '画像ファイル（複数可）を各パネルにドロップすると、そのパネルに画像メモとして追加',
              },
            ]}
          />
          <Paragraph>
            タイムラインはグループ（タイムライングループ）が 1 つもないと入力欄が無効化されます。
            先に「+ グループ」から追加してください。フリーメモ / 自分用メモはグループが無くても
            入力でき、グループ未選択のメモは「未分類」としてまとめられます。
          </Paragraph>
        </SubFeature>

        <SubFeature title="表示状態">
          <Paragraph>
            エントリは通常 / マウスホバー / 選択中で見た目が変わります。背景や左縦線が変化して、
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
      </>
    ),
  },
  // ── §6 タイムライン ───────────────────────────────────────
  {
    id: 'timeline',
    title: 'タイムライン',
    content: (
      <>
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
      </>
    ),
  },
  // ── §7 画像メモ ──────────────────────────────────────────
  {
    id: 'image',
    title: '画像メモ',
    content: (
      <>
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
      </>
    ),
  },
  // ── §8 グループ管理 ──────────────────────────────────────
  {
    id: 'groups',
    title: 'グループ管理',
    content: (
      <>
        <Paragraph>
          フリーメモと自分用メモは、エントリを「グループ」に分けて整理できます。 タイムラインも 2
          階層のグループ（タイムライングループ → 時刻順）で整理されます。
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
      </>
    ),
  },
  // ── §9 登場人物バッジ ────────────────────────────────────
  {
    id: 'badges',
    title: '登場人物バッジ',
    content: (
      <>
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
            そのパネル内のメモを該当人物に紐付くものだけに絞り込めます。 複数選択も可能で、右端の ✕
            で一括クリアできます。 絞り込みはパネルごとに独立して保持されます。
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
      </>
    ),
  },
];
