import { Link } from 'react-router-dom';

import { PageHead } from '@/components/seo/pageHead';
import { SITE_NAME, absoluteUrl } from '@/lib/siteMeta';

const GUIDE_TITLE = '使い方ガイド｜マダめもくん';
const GUIDE_DESCRIPTION =
  'マダめもくんの使い方を、機能ごとに動くプレビュー付きで紹介します。タイムライン・フリーメモ・登場人物・相関図・人物推理メモ・検索・Undo/Redo・エクスポート/インポートまで網羅。';

/**
 * 構造化データ: ガイドページは Article として記述する。
 * SSG 時点で本文と一緒に焼き込み、AI クローラの抽出精度を高める。
 */
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
 * SSG プリレンダ対象。フェーズ 1〜2 では仮の最小実装（CTA のみ）。
 * フェーズ 4 で機能別セクション + 動くプレビューを実装する。
 *
 * NOTE: 同上、`@/store` や `@/lib/idb` 等を import してはいけない。
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
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>使い方ガイド</h1>
        <p style={{ color: 'var(--text-secondary)' }}>準備中</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" className="btn-ghost btn-md">
            トップへ
          </Link>
          <Link to="/app" className="btn-primary btn-md">
            アプリを開く
          </Link>
        </div>
      </main>
    </>
  );
}

export const Component = GuidePage;
