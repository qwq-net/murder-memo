interface HourDividerViewProps {
  /** 中央に表示する時刻ラベル（例: "10:00", "不明"） */
  label: string;
  /** 「不明」セクションのように、薄い色で表示するか */
  muted?: boolean;
}

/**
 * タイムラインの時刻セパレータ（左右に薄い線 + 中央に時刻ラベル）。
 *
 * - `TimelineGroupSection` から各時刻グループの先頭で呼ばれる
 * - 末尾の「不明」セクションでは `muted=true` でより薄い色で表示する
 * - 純粋表示。`useStore` 等の依存はなく、Guide ページからも安全に呼べる
 */
export function HourDividerView({ label, muted }: HourDividerViewProps) {
  const lineColor = muted
    ? 'color-mix(in srgb, var(--border-subtle) 40%, transparent)'
    : 'color-mix(in srgb, var(--panel-timeline-accent) 15%, transparent)';

  return (
    <div className="flex items-center gap-2 pt-0.5 pr-2 pb-0 pl-0">
      {/* 左ライン — 縦線とクロスする */}
      <span className="h-px flex-1" style={{ background: lineColor }} />
      <span
        className={`shrink-0 font-mono text-sm tracking-[0.06em] ${
          muted ? 'text-text-faint' : 'text-text-muted'
        }`}
      >
        {label}
      </span>
      {/* 右ライン */}
      <span className="h-px flex-1" style={{ background: lineColor }} />
    </div>
  );
}
