import type { RouteRecord } from 'vite-react-ssg';
import { ViteReactSSG } from 'vite-react-ssg';
import routes from '~react-pages';

import './index.css';

/**
 * Vite + React 19 + vite-react-ssg のエントリポイント。
 *
 * - ルーティング: `src/pages/` 配下のファイルから `vite-plugin-pages` が自動生成
 * - SSG プリレンダ対象: `vite.config.ts` の `ssgOptions.includedRoutes` で `/`, `/guide` を指定
 * - `/app` は CSR-only（クライアントでのみマウント）
 *
 * 旧 `createRoot(<App />)` 直マウントから、ファイルベース + ルーター駆動に移行。
 */
export const createRoot = ViteReactSSG({
  routes: routes as RouteRecord[],
});
