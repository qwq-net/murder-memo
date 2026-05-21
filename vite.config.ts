import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import Pages from 'vite-plugin-pages';
import { VitePWA } from 'vite-plugin-pwa';
// vite-react-ssg は vite の UserConfig に ssgOptions を declare module で追加する。
// この型拡張を取り込むため副作用なし import を残す。
import type {} from 'vite-react-ssg';

/**
 * vite-react-ssg を利用したファイルベースルーティング + SSG プリレンダ構成。
 *
 * - `src/pages/index.tsx` → `/` (SSG)
 * - `src/pages/guide.tsx` → `/guide` (SSG)
 * - `src/pages/app/index.tsx` → `/app` (CSR only。SSG プリレンダ対象から除外)
 *
 * `/app` 配下は IndexedDB / Zustand を使う重量級 SPA のためビルド時に評価せず、
 * クライアント側でのみマウントする。
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    Pages({
      dirs: 'src/pages',
      extensions: ['tsx'],
    }),
    // PWA 対応:
    // - Service Worker を生成して `navigator.serviceWorker.register` を自動注入
    // - Web App Manifest を生成（既存パス `/site.webmanifest` を踏襲）
    // - インストール条件を満たすため purpose は "any maskable" を併記
    // - SSG プリレンダされる `/`, `/guide`, `/app` の HTML / アセットを precache 対象に含める
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'site.webmanifest',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'マダめもくん',
        short_name: 'マダめも',
        id: '/app',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        theme_color: '#0d0c0a',
        background_color: '#0d0c0a',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json}'],
        // IndexedDB に保存される画像が大きくなりうるので precache のサイズ上限を緩める
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      // dev サーバーで manifest / SW を確認したい時のみ有効化する。
      // 環境変数 VITE_PWA_DEV=1 で `npm run dev` 時も PWA を動かせる。
      // 常時有効化するとキャッシュ起因の挙動変化で開発体験が悪化するため、デフォルトは無効。
      devOptions: {
        enabled: process.env.VITE_PWA_DEV === '1',
        type: 'module',
        navigateFallback: '/app/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  ssgOptions: {
    // /foo → /foo/index.html（既存の /sitemap.xml 等とパスを揃える）
    dirStyle: 'nested',
    // /app は <ClientOnly> でラップされており、プリレンダ時は空シェル HTML が出力される
    // （`src/pages/app/index.tsx` 参照）。これにより `/app/*` 直アクセス時の SPA fallback が成立する
    includedRoutes: () => ['/', '/guide', '/app'],
    // window / document を SSG レンダ中にも軽くスタブして、依存ライブラリの即時参照を吸収
    mock: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dndkit';
          }
        },
      },
    },
  },
});
