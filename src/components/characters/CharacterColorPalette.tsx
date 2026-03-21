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
    <div className="flex gap-1 flex-wrap items-center">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className="shrink-0 cursor-pointer rounded-full transition-[border-color,transform] duration-100"
          style={{
            width: 20,
            height: 20,
            background: color,
            border: value === color ? '2px solid var(--text-primary)' : '2px solid transparent',
            transform: value === color ? 'scale(1.15)' : 'scale(1)',
          }}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-none p-0 bg-transparent"
        style={{ width: 20, height: 20 }}
        title="カスタムカラー"
      />
    </div>
  );
}
