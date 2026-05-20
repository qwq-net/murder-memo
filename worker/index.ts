import type { Env } from './types';

/**
 * SPA fallback ハンドラ。
 *
 * 配信構成:
 *   - `/`      → `dist/index.html`        (LP, SSG)
 *   - `/guide` → `dist/guide/index.html`  (Guide, SSG)
 *   - `/app/*` → `dist/app/index.html`    (CSR SPA シェル)
 *
 * `wrangler.jsonc` の `not_found_handling: "single-page-application"` だけだと、
 * `/app/foo/bar` をリロードした際に Cloudflare のデフォルト fallback が `dist/index.html`（LP）
 * になってしまうため、`/app/*` への 404 を捕まえて `/app/index.html` を 200 で返す。
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    // /app 配下で 404 が返ったら SPA シェルにフォールバックする
    if (response.status === 404 && url.pathname.startsWith('/app')) {
      const shellUrl = new URL('/app/index.html', url.origin);
      const shellResponse = await env.ASSETS.fetch(new Request(shellUrl, request));
      // ASSETS が 200 を返したら、それを 200 として再構成して返す
      // （`fetch` をそのまま返すと一部メタデータが透過するため明示的に new Response）
      if (shellResponse.ok) {
        return new Response(shellResponse.body, {
          status: 200,
          headers: shellResponse.headers,
        });
      }
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
