import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import Pages from 'vite-plugin-pages';
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
