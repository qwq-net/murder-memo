import { Link } from 'react-router-dom';

/**
 * 主な機能を箇条書きで簡素に並べるセクション。
 *
 * カード化やアイコン装飾は避け、できることの事実を 2 カラムのリストで列挙する。
 * 末尾にローカル保存の注意書きと、ガイド / サンプルシナリオへの誘導を置く。
 */
const FEATURES: string[] = [
  '登場人物の登録（PL / NPC）',
  '相関図ビュー',
  '人物推理メモ（犯人投票・疑惑度）',
  '横断検索',
  'Undo / Redo',
  'エクスポート / インポート',
  'PWA 対応（オフラインで起動可）',
  'パネルの並び順 / 表示形式のカスタマイズ',
];

export function Features() {
  return (
    <section
      style={{
        padding: '8px 24px 48px',
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 12px',
        }}
      >
        できること
      </h2>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '6px 24px',
        }}
      >
        {FEATURES.map((feature) => (
          <li
            key={feature}
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              position: 'relative',
              paddingLeft: 14,
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: '0.7em',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--text-faint)',
              }}
            />
            {feature}
          </li>
        ))}
      </ul>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}
      >
        メモはブラウザのローカルストレージ（IndexedDB）に保存され、サーバーには送信されません。
      </p>

      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}
      >
        詳しい操作方法は{' '}
        <Link to="/guide" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          使い方ガイド
        </Link>{' '}
        か、アプリ内のサンプルシナリオで確認してください。
      </p>
    </section>
  );
}
