import type { ReactNode } from 'react';

interface TimelineEntryViewProps {
  /** 表示する時刻文字列（例: "19:30"）。空文字なら時刻列を空欄表示する */
  eventTime: string;
  /** 時刻列を完全に隠す（重複時刻のグループ表示用） */
  hideTime?: boolean;
  /** 右側のコンテンツ。テキスト本文・画像・バッジバー等を呼び出し側で組み立てる */
  children: ReactNode;
}

/**
 * `TimelineEntry` の表示レイアウトを切り出した純粋表示版。
 *
 * - props で時刻文字列 + コンテンツ要素を受け取り、`useStore` には触れない
 * - 編集機能（時刻 input / フォーカス制御）は持たず、表示だけを担当する
 * - 時刻列 + ガター + コンテンツの 3 カラム配置と、本体と同じスタイル変数を共有する
 * - Guide ページのように本物の store に依存できない場面でそのまま使える
 */
export function TimelineEntryView({ eventTime, hideTime, children }: TimelineEntryViewProps) {
  const timeText = hideTime ? '' : eventTime;

  return (
    <div
      style={{
        padding: '1px 4px 0 var(--tl-entry-pad-left)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--tl-time-gap)',
        minHeight: 22,
      }}
    >
      <span
        style={{
          width: 'var(--tl-time-width)',
          flexShrink: 0,
          boxSizing: 'border-box',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          lineHeight: 1.2,
          letterSpacing: '0.04em',
          textAlign: 'center',
          padding: '2px 4px',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          color: timeText ? 'var(--panel-timeline-accent)' : 'var(--text-faint)',
        }}
      >
        {timeText}
      </span>
      {children}
    </div>
  );
}
