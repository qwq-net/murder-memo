import { Features } from '@/components/lp/Features';
import { Hero } from '@/components/lp/Hero';
import { LpLayout } from '@/components/lp/LpLayout';
import { PanelIntro } from '@/components/lp/PanelIntro';
import { PageHead } from '@/components/seo/pageHead';
import { SITE_ORIGIN } from '@/lib/siteMeta';

const LP_TITLE = 'マダめもくん｜マーダーミステリー専用メモアプリ';
const LP_DESCRIPTION =
  'マーダーミステリーのプレイ中に使うメモアプリです。タイムライン・フリーメモ・自分用メモの3つのパネルで情報を整理できます。';

/**
 * 構造化データ: アプリ本体は WebApplication として記述する。
 * SSG プリレンダ時に静的 HTML に焼き込まれるため、AI クローラ / 検索エンジン双方からインデックス可能。
 */
const LP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'マダめもくん',
  description: 'マーダーミステリーのプレイ中に使うメモアプリ',
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
 * SSG プリレンダ対象。Hero + 3 パネル紹介 + 機能リスト + フッターのミニマル構成。
 * 機能紹介や操作方法は使い方ガイド側に任せ、ここでは「何のアプリか」だけを伝える。
 *
 * 制約:
 *   - このファイルおよびその import 先は SSG ビルド時に Node 環境で評価される
 *   - `@/store`, `@/lib/idb`, `@dnd-kit/*` 等の重量級 import は禁止
 */
export default function LandingPage() {
  return (
    <>
      <PageHead title={LP_TITLE} description={LP_DESCRIPTION} path="/" jsonLd={LP_JSON_LD} />
      <LpLayout>
        <Hero />
        <PanelIntro />
        <Features />
      </LpLayout>
    </>
  );
}

export const Component = LandingPage;
