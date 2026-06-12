/**
 * 使い方ガイドのセクション定義（基本編：はじめに / セッションを作る / 登場人物を登録する / 3 つのパネル）。
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
import { ActionOrderStepperPreview } from '@/components/guide/previews/ActionOrderStepperPreview';
import { CharacterRowsPreview } from '@/components/guide/previews/CharacterRowsPreview';
import { InlineCharacterPreview } from '@/components/guide/previews/InlineCharacterPreview';
import type { GuideSection } from './types';

export const basicsSections: GuideSection[] = [
  // ── §1 はじめに ───────────────────────────────────────────
  {
    id: 'intro',
    title: 'はじめに',
    content: (
      <>
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
      </>
    ),
  },
  // ── §2 セッションを作る ───────────────────────────────────
  {
    id: 'sessions',
    title: 'セッションを作る',
    content: (
      <>
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
      </>
    ),
  },
  // ── §3 登場人物を登録する ────────────────────────────────
  {
    id: 'characters',
    title: '登場人物を登録する',
    content: (
      <>
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
      </>
    ),
  },
  // ── §4 3 つのパネル ───────────────────────────────────────
  {
    id: 'panels',
    title: '3 つのパネル',
    content: (
      <>
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

        <SubFeature title="レイアウトの変更">
          <Paragraph>
            ヘッダーの「レイアウト」ボタンから、現在のセッションのパネル配置を変更できます。
          </Paragraph>
          <KeyValueTable
            rows={[
              {
                key: '構造（デスクトップのみ）',
                value: '3枚表示時: 3列 / 左を上下分割 / 右を上下分割。2枚表示時: 2列 / 上下2段',
              },
              {
                key: 'パネルの表示/非表示',
                value: '各パネルを個別に表示・非表示にできます。最低1枚は表示が必要です',
              },
              {
                key: '並び順',
                value: '表示中のパネルの左右（または上下）の順序を変更できます',
              },
              {
                key: 'パネル境界のドラッグ',
                value:
                  'パネル間の境界をドラッグして幅（上下分割時は高さ）を調整できます。調整結果は保存されます',
              },
            ]}
          />
        </SubFeature>

        <SubFeature title="セッション設定とグローバル設定">
          <Paragraph>レイアウト設定は2層に分かれています。</Paragraph>
          <KeyValueTable
            rows={[
              {
                key: 'ヘッダーの「レイアウト」',
                value: '現在のセッションにのみ適用されます',
              },
              {
                key: 'アプリ設定の「レイアウト」',
                value:
                  'グローバル設定です。新しいセッションを作成したときの初期値として引き継がれます',
              },
              {
                key: 'グローバル設定に戻す',
                value:
                  'セッション側で変更した後、「グローバル設定に戻す」でグローバル準拠に戻せます',
              },
            ]}
          />
          <SubList
            items={[
              '非表示にしたパネルのメモは消えません。検索にも引き続きヒットし、結果をクリックすると自動でパネルが再表示されます',
              '右クリックメニューの移動先には非表示パネルも「（非表示中）」と表示されて選べます',
              'モバイルでは非表示パネルがタブからも消えます（構造の選択はデスクトップのみ）',
            ]}
          />
        </SubFeature>
      </>
    ),
  },
];
