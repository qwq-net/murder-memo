import { PreviewFrame } from '@/components/guide/PreviewFrame';
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

/**
 * `/guide` 使い方ガイドページ。
 *
 * SSG プリレンダ対象。LP と同じ `LpLayout` でヘッダー / フッターを統一する。
 * 装飾は最小限、文言は事実ベースで淡々と。
 *
 * 構成:
 *   1. はじめに（アプリ概要 + サンプルシナリオの話）
 *   2. 3 つのパネル（タイムライン / フリーメモ / 自分用メモ）
 *   3. 主要機能（登場人物 / 相関図 / 人物推理メモ / 検索・リンク）
 *   4. 操作・保存（Undo/Redo / ショートカット / エクスポート/インポート / ローカル保存）
 *
 * NOTE: SSG 評価対象なので、`@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 * プレビューは「Guide で本物を動かす」前提だが、本ファイルでは骨格のみ。
 * 実プレビューはフェーズ4-C2 で `*View` 抽出後に差し込む。
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
              マダめもくんの基本的な使い方をまとめたページです。
              実際の操作感はアプリ内のサンプルシナリオでも確認できます。
            </p>
          </header>

          {/* 1. はじめに ─────────────────────────────────────────────── */}
          <Section id="intro" title="はじめに">
            <Paragraph>
              マダめもくんは、マーダーミステリーのプレイ中に使うメモアプリです。
              タイムライン・フリーメモ・自分用メモの 3
              つのパネルで情報を整理して、推理を進めるための場所を提供します。
            </Paragraph>
            <Paragraph>
              初回アクセス時はサンプルシナリオが入った状態で開きます。
              メモの追加・編集・並び替え・削除など、まずは自由に触って操作感を確かめてみてください。
              実際のプレイ時は、ヘッダーの「+」ボタンから新しいセッションを作成して始められます。
            </Paragraph>
          </Section>

          {/* 2. 3 つのパネル ─────────────────────────────────────────── */}
          <Section id="panels" title="3 つのパネル">
            <Paragraph>
              アプリ画面はデスクトップで横並び 3 列、モバイルではタブ切替で表示されます。
              各パネルは独立しており、書いたメモは他のパネルに自動では引き継がれません。
            </Paragraph>

            <PanelSubsection
              name="タイムライン"
              accent="var(--panel-timeline-accent)"
              description="時刻つきで出来事や証言を並べるパネルです。"
            >
              <SubList
                items={[
                  '時刻欄をクリックすると hh:mm 形式で時刻を入力できます',
                  '時刻入力欄では「530」と入れると「5:30」に自動補完されます',
                  '時刻なしのエントリを混在させても並び順は保持されます',
                  'グループ機能でフェーズ（事件発生前 / 議論中など）に区切れます',
                ]}
              />
              <PreviewFrame label="タイムラインカード（プレビュー）">
                <PreviewPlaceholder note="フェーズ4-C2 で実コンポーネントを差し込みます" />
              </PreviewFrame>
            </PanelSubsection>

            <PanelSubsection
              name="フリーメモ"
              accent="var(--panel-free-accent)"
              description="事実・証拠・キーアイテムなどを共有メモとしてまとめるパネルです。"
            >
              <SubList
                items={[
                  'ドラッグ&ドロップで並び替えできます',
                  'クリップボードから画像を直接貼り付けできます（Ctrl + V）',
                  'グループ機能で「証拠品」「証言」などのカテゴリに分けられます',
                  '関連する登場人物を、各エントリにバッジで紐付けられます',
                ]}
              />
              <PreviewFrame label="フリーメモカード（プレビュー）">
                <PreviewPlaceholder note="フェーズ4-C2 で実コンポーネントを差し込みます" />
              </PreviewFrame>
            </PanelSubsection>

            <PanelSubsection
              name="自分用メモ"
              accent="var(--panel-personal-accent)"
              description="自分だけが見るメモを書くパネルです。"
            >
              <SubList
                items={[
                  '操作はフリーメモと同じ（並び替え・画像・グループ・バッジ対応）',
                  '仮説や疑念など、卓内で共有したくない情報を分けて管理できます',
                ]}
              />
            </PanelSubsection>
          </Section>

          {/* 3. 主要機能 ────────────────────────────────────────────── */}
          <Section id="features" title="主要機能">
            <FeatureSubsection title="登場人物">
              <Paragraph>
                ヘッダーの「登場人物」から PL / NPC を登録できます。
                登録した人物はメモにバッジとして付与でき、相関図や人物推理メモでも参照されます。
              </Paragraph>
              <PreviewFrame label="登場人物バッジ（プレビュー）">
                <PreviewPlaceholder note="フェーズ4-C2 で実コンポーネントを差し込みます" />
              </PreviewFrame>
            </FeatureSubsection>

            <FeatureSubsection title="相関図">
              <Paragraph>
                登録した登場人物どうしを関係線で結べる機能です。 線の色やラベルで関係性（友人 / 敵対
                / 取引相手など）を表現できます。
                マウスホイールでズーム、ドラッグでパン操作が可能です。
              </Paragraph>
              <PreviewFrame label="相関図（プレビュー）">
                <PreviewPlaceholder note="フェーズ4-C2 で実コンポーネントを差し込みます" />
              </PreviewFrame>
            </FeatureSubsection>

            <FeatureSubsection title="人物推理メモ">
              <Paragraph>
                犯人投票・疑惑度を人物別に記録できる機能です。 最終議論前の頭の整理や、各 PL
                に対する疑惑度の変化の記録に使えます。
              </Paragraph>
            </FeatureSubsection>

            <FeatureSubsection title="検索・リンク一覧">
              <Paragraph>
                ヘッダーの「検索」から、タイムライン・フリーメモ・自分用メモを横断してキーワード検索できます。
                メモ内には <Code>[[キーワード]]</Code>{' '}
                形式でリンクを書け、ヘッダーの「リンク一覧」から
                同じキーワードを使ったメモを一覧できます。
              </Paragraph>
            </FeatureSubsection>
          </Section>

          {/* 4. 操作・保存 ─────────────────────────────────────────── */}
          <Section id="operations" title="操作・保存">
            <FeatureSubsection title="Undo / Redo">
              <Paragraph>
                メモの追加・編集・削除は履歴に記録されます。 Ctrl + Z で取り消し、Ctrl + Shift + Z
                でやり直しができます。 セッションを切り替えると履歴はリセットされます。
              </Paragraph>
            </FeatureSubsection>

            <FeatureSubsection title="キーボードショートカット">
              <ShortcutTable
                shortcuts={[
                  { keys: 'Ctrl + Z', desc: '直前の操作を取り消す' },
                  { keys: 'Ctrl + Shift + Z', desc: 'やり直す' },
                  { keys: 'Ctrl + V', desc: '画像メモを貼り付ける（パネル内）' },
                  { keys: 'Esc', desc: '編集中のメモを確定 / モーダルを閉じる' },
                ]}
              />
            </FeatureSubsection>

            <FeatureSubsection title="エクスポート / インポート">
              <Paragraph>
                ヘッダーの「アプリ設定」→ バックアップから、セッション全データを JSON
                ファイルに書き出せます。 書き出したファイルは同じ画面から読み込めるので、PC
                間の移行や、 バージョンが大きく変わる前のバックアップに使えます。
              </Paragraph>
            </FeatureSubsection>

            <FeatureSubsection title="データの保存先">
              <Paragraph>
                メモは端末のブラウザに組み込まれた
                IndexedDB（オフラインデータベース）に保存されます。
                サーバーには送信されないので、利用にあたってアカウント登録は不要です。
              </Paragraph>
              <Paragraph>
                ブラウザのキャッシュ / サイトデータを削除するとメモも消えます。
                重要なデータは事前にエクスポートしておいてください。
              </Paragraph>
            </FeatureSubsection>
          </Section>
        </article>
      </LpLayout>
    </>
  );
}

export const Component = GuidePage;

/* ── Guide 内のローカル共通要素（このファイル内でのみ使う簡素な部品） ────────── */

/** ガイド本文の段落。`<p>` を読みやすい行間で出す共通スタイル。 */
function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.9,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

/** 簡素な箇条書き。Section / PanelSubsection 配下で再利用する。 */
function SubList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            position: 'relative',
            paddingLeft: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: '0.75em',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--text-faint)',
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** インラインコード表示。`[[xxx]]` のようなメモ内記法を見せるとき用。 */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        background: 'var(--bg-elevated)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </code>
  );
}

/**
 * 3 パネル紹介の各サブセクション。
 * パネル名 + アクセント色のバー + 説明 + 内容（リスト・プレビュー）。
 */
function PanelSubsection({
  name,
  accent,
  description,
  children,
}: {
  name: string;
  accent: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          paddingLeft: 12,
          borderLeft: `3px solid ${accent}`,
          letterSpacing: '0.02em',
        }}
      >
        {name}
      </h3>
      <Paragraph>{description}</Paragraph>
      {children}
    </div>
  );
}

/** 主要機能・操作セクションの 1 項目分のサブセクション。h3 + 子要素。 */
function FeatureSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * プレビュー差し込み待ちの一時的なプレースホルダ。
 * フェーズ4-C2 で `*View` 抽出 + 実コンポーネント表示に差し替える。
 */
function PreviewPlaceholder({ note }: { note: string }) {
  return (
    <div
      style={{
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
        background: 'var(--bg-elevated)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {note}
    </div>
  );
}

/** キーボードショートカット表。シンプルな 2 列 grid。 */
function ShortcutTable({ shortcuts }: { shortcuts: { keys: string; desc: string }[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 16,
        rowGap: 6,
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.8,
      }}
    >
      {shortcuts.map(({ keys, desc }) => (
        <div key={keys} style={{ display: 'contents' }}>
          <Code>{keys}</Code>
          <span>{desc}</span>
        </div>
      ))}
    </div>
  );
}
