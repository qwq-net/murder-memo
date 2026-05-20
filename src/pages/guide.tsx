import { Link } from 'react-router-dom';

/**
 * `/guide` 使い方ガイドページ。
 *
 * SSG プリレンダ対象。フェーズ 1 では仮の最小実装（CTA のみ）。
 * フェーズ 4 で機能別セクション + 動くプレビューを実装する。
 *
 * NOTE: 同上、`@/store` や `@/lib/idb` 等を import してはいけない。
 */
export default function GuidePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>使い方ガイド</h1>
      <p style={{ color: 'var(--text-secondary)' }}>準備中</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" className="btn-ghost btn-md">
          トップへ
        </Link>
        <Link to="/app" className="btn-primary btn-md">
          アプリを開く
        </Link>
      </div>
    </main>
  );
}

export const Component = GuidePage;
