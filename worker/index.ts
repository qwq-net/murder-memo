import type { Env } from './types';

const CANONICAL_HOST = 'memo.qwqb.net';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // workers.dev ドメインからのアクセスは正規ドメインにリダイレクト
    if (url.hostname !== CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
