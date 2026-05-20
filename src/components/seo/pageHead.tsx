import { Head } from 'vite-react-ssg';

import { absoluteUrl } from '@/lib/siteMeta';

interface PageHeadProps {
  /** `<title>` の値（サイト名は呼び出し側で含めて渡す） */
  title: string;
  /** `<meta name="description">` および og/twitter description に流用される文章 */
  description: string;
  /** canonical / og:url で使う絶対 URL のパス（例: '/', '/guide'）。指定しなければ canonical を出さない */
  path?: string;
  /** Twitter Card 用の短い description（指定しなければ description を流用） */
  twitterDescription?: string;
  /** robots ヘッダー（noindex 等を指定したい場合のみ） */
  robots?: string;
  /** JSON-LD 構造化データ。オブジェクトを渡すと `<script type="application/ld+json">` として出力する */
  jsonLd?: Record<string, unknown>;
}

/**
 * 各ページから呼び出してドキュメントヘッドを上書きする共通コンポーネント。
 *
 * - 内部で `vite-react-ssg` の `<Head>`（React Helmet ラッパー）を利用する
 * - SSG ビルド時はプリレンダ HTML に直接焼き込まれ、CSR 中はクライアントで上書きされる
 * - `index.html` には全ページ共通のメタ（og:type / og:locale / og:image / og:site_name /
 *   twitter:card / twitter:image / favicon / manifest / theme-color など）が残っており、
 *   ここからはページ固有のメタ（title / description / canonical / og:title など）のみを注入する
 *
 * 注意: og:image / og:site_name / twitter:image は全ページ共通のため `index.html` 側に置く。
 * Helmet 経由で重複注入すると HTML が冗長になるためここでは扱わない。
 */
export function PageHead({
  title,
  description,
  path,
  twitterDescription,
  robots,
  jsonLd,
}: PageHeadProps) {
  const canonical = path ? absoluteUrl(path) : undefined;
  const twDesc = twitterDescription ?? description;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}

      {/* Open Graph（ページ固有分のみ） */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}

      {/* Twitter Card（ページ固有分のみ） */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={twDesc} />

      {/* JSON-LD 構造化データ */}
      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Head>
  );
}
