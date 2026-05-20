interface PanelCard {
  /** パネル名 */
  name: string;
  /** アクセントカラー（CSS variable 参照） */
  accent: string;
  /** 用途の説明 */
  description: string;
}

/**
 * 3 つのパネル（タイムライン・フリーメモ・自分用メモ）の用途を並べるセクション。
 *
 * ここはアプリの中核なので LP でも残す。文言は「何を書くか」の事実ベースで、
 * 詳しい操作はガイドに任せる。
 */
const PANELS: PanelCard[] = [
  {
    name: 'タイムライン',
    accent: 'var(--panel-timeline-accent)',
    description: '時刻つきで出来事や証言を並べます。',
  },
  {
    name: 'フリーメモ',
    accent: 'var(--panel-free-accent)',
    description: '事実・証拠・キーアイテムなどを共有メモとしてまとめます。',
  },
  {
    name: '自分用メモ',
    accent: 'var(--panel-personal-accent)',
    description: '仮説や疑惑など、自分だけのメモを書きます。',
  },
];

export function PanelIntro() {
  return (
    <section
      style={{
        padding: '24px 24px 56px',
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {PANELS.map((panel) => (
          <article
            key={panel.name}
            style={{
              padding: '18px 18px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              borderTop: `3px solid ${panel.accent}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {panel.name}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {panel.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
