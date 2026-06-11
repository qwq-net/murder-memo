import { registerSW } from 'virtual:pwa-register';
import type { RouteRecord } from 'vite-react-ssg';
import { ViteReactSSG } from 'vite-react-ssg';
import routes from '~react-pages';

import './index.css';

/**
 * Service Worker を登録し、新バージョン検知時にページを自動リロードする。
 *
 * `vite.config.ts` は `registerType: 'autoUpdate'` のため、新 SW は `skipWaiting()` +
 * `clientsClaim()` で即座に有効化される。ここで `virtual:pwa-register` の `registerSW` を
 * 明示的に呼ぶことで workbox-window 版の登録コードが使われ、新 SW が有効化された
 * （`activated` の `isUpdate`）タイミングで `window.location.reload()` が走る。
 *
 * これがないと（`injectRegister: 'auto'` の単純版スクリプト注入のみだと）、新 SW が
 * 制御を奪っても表示中のページは古いバンドルのままで、フルリロードするまで新しい
 * `APP_VERSION` がロードされず、ウェルカムモーダルも出ない（リロード忘れ問題の原因）。
 *
 * `virtual:pwa-register` をインポートすると vite-plugin-pwa は単純版スクリプトの自動注入を
 * 抑止する（`useImportRegister`）ため、二重登録にはならない。
 * SSG プリレンダ（サーバ実行）時には `navigator` が無いので呼ばない。
 */
if (!import.meta.env.SSR) {
  registerSW({ immediate: true });
}

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
