/**
 * サイト全体で共通利用するメタ情報の定数群。
 *
 * - 各ページの `<Head>` から参照し、title / description / canonical / OGP / JSON-LD を組み立てる
 * - URL は本番ドメインを起点に組み立てる（プレビュー / 開発時は canonical / OGP url が本番ドメインを指すが、
 *   SEO 観点で問題ないため許容）
 *
 * NOTE: このモジュールは SSG ビルド時にも評価されるため、IndexedDB / window / document に
 * 依存する import は含めないこと。
 */

/** 本番ドメインのオリジン（末尾スラッシュなし） */
export const SITE_ORIGIN = 'https://memo.qwqb.net';

/** サイト名（OGP の og:site_name や JSON-LD で利用） */
export const SITE_NAME = 'マダめもくん';

/** OGP / Twitter Card 用の画像 URL */
export const SITE_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/** 与えられたパスから絶対 URL を組み立てる */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${SITE_ORIGIN}/${path}`;
  }
  return `${SITE_ORIGIN}${path}`;
}
