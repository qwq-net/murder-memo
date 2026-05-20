import { Link } from 'react-router-dom';

import { PageHead } from '@/components/seo/pageHead';
import { SITE_ORIGIN } from '@/lib/siteMeta';

const LP_TITLE = 'マダめもくん｜マーダーミステリー専用メモアプリ';
const LP_DESCRIPTION =
  'マーダーミステリーのプレイ中に使える、メモ特化の無料Webアプリ。タイムライン・フリーメモ・自分用メモの3パネルで情報を整理し、推理をスムーズに進められます。';

/**
 * 構造化データ: アプリ本体は WebApplication として記述する。
 * SSG プリレンダ時に静的 HTML に焼き込まれるため、AI クローラ / 検索エンジン双方からインデックス可能。
 */
const LP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'マダめもくん',
  description: 'マーダーミステリーのプレイ中に使える、メモ特化の無料Webアプリ',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
  inLanguage: 'ja',
  url: `${SITE_ORIGIN}/`,
};

/**
 * ルート (`/`) ランディングページ。
 *
 * SSG プリレンダ対象。フェーズ 1〜2 では仮の最小実装（CTA のみ）。
 * フェーズ 3 で Hero / 機能紹介 / CTA / フッターを実装する。
 *
 * NOTE: このファイルおよびその import 先は SSG ビルド時に Node 環境で評価される。
 * `@/store` や `@/lib/idb` 等の IndexedDB / window / document に依存する import は禁止。
 */
export default function LandingPage() {
  return (
    <>
      <PageHead title={LP_TITLE} description={LP_DESCRIPTION} path="/" jsonLd={LP_JSON_LD} />
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
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>マダめもくん</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          マーダーミステリー専用メモアプリ（ランディングページは準備中）
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/app" className="btn-primary btn-md">
            アプリを開く
          </Link>
          <Link to="/guide" className="btn-ghost btn-md">
            使い方を見る
          </Link>
        </div>
      </main>
    </>
  );
}

export const Component = LandingPage;
