import type { ReactNode } from 'react';

import { LpFooter } from '@/components/lp/LpFooter';
import { LpHeader } from '@/components/lp/LpHeader';

/**
 * LP / Guide 共通レイアウト。
 *
 * sticky footer パターン:
 *   - ルートを `min-height: 100dvh` の flex column にし、`<main>` を `flex: 1` で伸縮させる
 *   - コンテンツが少ない時はフッターがブラウザ最下部に張り付く
 *   - コンテンツが多い時は自然に押し下げられ、コンテンツの直下に配置される
 *
 * ヘッダーは sticky 指定（`LpHeader` 内）なので、本コンポーネントでは flex の通常配置で良い。
 */
export function LpLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LpHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <LpFooter />
    </div>
  );
}
