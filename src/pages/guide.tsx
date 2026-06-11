import { TableOfContents } from '@/components/guide/parts/TableOfContents';
import { Section } from '@/components/guide/Section';
import { GUIDE_SECTIONS } from '@/components/guide/sections';
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

/** 目次に並べるセクション一覧（GUIDE_SECTIONS から導出するため、id・タイトルがズレることはない） */
const TOC_ITEMS = GUIDE_SECTIONS.map((section) => ({ id: section.id, label: section.title }));

/** useActiveSection に渡す ID 配列（モジュールスコープで安定参照にする） */
const TOC_IDS = TOC_ITEMS.map((item) => item.id);

/**
 * `/guide` 使い方ガイドページ。
 *
 * SSG プリレンダ対象。LP と同じ `LpLayout` でヘッダー / フッターを統一する。
 * 文体は事実ベースで淡々と。装飾語禁止。
 *
 * 構成は「利用フロー順」に再編した 14 セクション。本文の定義（JSX）は
 * `@/components/guide/sections` に分離し、このファイルはレンダリングと目次ロジックのみを持つ。
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

            {/* ── 本文セクション（定義は sections/ 配下。表示順は GUIDE_SECTIONS の順序） ── */}
            {GUIDE_SECTIONS.map((section) => (
              <Section key={section.id} id={section.id} title={section.title}>
                {section.content}
              </Section>
            ))}
          </article>
        </div>
      </LpLayout>
    </>
  );
}

export const Component = GuidePage;
