import { lazy, Suspense } from 'react';
import { ClientOnly } from 'vite-react-ssg';

/**
 * `/app` メモアプリ本体のページ。
 *
 * 構成:
 *   - SSG プリレンダ時はこのファイルだけが評価され、`<ClientOnly>` が中身を空に潰す
 *     → `dist/app/index.html` は空シェル（`<div id="root"></div>`）として出力される
 *   - クライアントマウント時のみ `AppRoot` が動的 import される
 *     → IndexedDB / Zustand / @dnd-kit の重量級依存が SSG バンドルから完全に切り離される
 *
 * これにより:
 *   - LP / Guide のバンドルに `/app` の依存が混入しない
 *   - `/app/*` への直アクセス時、worker が `dist/app/index.html` を返す（worker/index.ts 参照）
 */
const AppRoot = lazy(() => import('@/components/app/appRoot'));

export default function AppPage() {
  return (
    <ClientOnly>
      {() => (
        <Suspense fallback={null}>
          <AppRoot />
        </Suspense>
      )}
    </ClientOnly>
  );
}

export const Component = AppPage;
