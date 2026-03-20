// マダミスでよく使われるテーマカラーのプリセット
const PRESET_COLORS = [
  '#e74c3c', // 赤
  '#e67e22', // オレンジ
  '#f1c40f', // 黄
  '#2ecc71', // 緑
  '#1abc9c', // ティール
  '#3498db', // 青
  '#2c3e93', // 紺
  '#9b59b6', // 紫
  '#e91e8c', // ピンク
  '#8d6e63', // ブラウン
  '#607d8b', // グレーブルー
  '#ecf0f1', // 白
];

interface CharacterColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
}

export function CharacterColorPalette({ value, onChange }: CharacterColorPaletteProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: color,
            border: value === color ? '2px solid var(--text-primary)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'border-color 0.12s, transform 0.12s',
            transform: value === color ? 'scale(1.15)' : 'scale(1)',
            flexShrink: 0,
          }}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 20,
          height: 20,
          border: 'none',
          padding: 0,
          background: 'none',
          cursor: 'pointer',
        }}
        title="カスタムカラー"
      />
    </div>
  );
}
