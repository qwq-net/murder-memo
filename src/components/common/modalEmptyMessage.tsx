import type { ReactNode } from 'react';

// モーダル内の空状態メッセージ用スタイル（毎レンダー再生成を避けるためモジュールスコープに固定）
const EMPTY_MESSAGE_STYLE: React.CSSProperties = {
  padding: '24px 0',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: 14,
};

/**
 * モーダル内の「データなし」中央寄せメッセージ。
 * 複数モーダルで重複していた div を集約。
 * - style: 行間など追加スタイルを差し込む（lineHeight 等が必要な箇所向け）
 */
export function ModalEmptyMessage({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style ? { ...EMPTY_MESSAGE_STYLE, ...style } : EMPTY_MESSAGE_STYLE}>{children}</div>
  );
}
