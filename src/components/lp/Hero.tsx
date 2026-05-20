import { Link } from 'react-router-dom';

/**
 * LP のヒーローセクション。
 *
 * ロゴ + アプリ名 + 1 行の役割説明 + CTA 2 つ。
 * できることの詳細はガイドに任せ、ここでは何のアプリかが分かる最小限の情報だけ置く。
 */
export function Hero() {
  return (
    <section
      style={{
        padding: '64px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 20,
      }}
    >
      <img src="/logo.svg" alt="" width="72" height="72" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
        <h1
          style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          マダめもくん
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          マーダーミステリーのプレイ中に使うメモアプリです。
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <Link to="/app" className="btn-primary btn-md">
          メモを開く
        </Link>
        <Link to="/guide" className="btn-ghost btn-md">
          使い方を見る
        </Link>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
        PC での利用を前提とした β バージョンです
      </p>
    </section>
  );
}
