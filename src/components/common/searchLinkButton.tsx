import { useCallback, type MouseEvent } from 'react';

import { useT } from '@/i18n';

/**
 * 検索ショートカット用ボタンの共通コンポーネント。
 *
 * `[テキスト]` 形式と辞書ワード自動リンク化、リンク一覧モーダルから等、
 * 「クリックで `openSearchWith(keyword)` を起動する青字+破線下線のリンク」を
 * 描画する箇所はすべてこのコンポーネントを利用する。
 *
 * - variant='inline' (default): エントリ本文に埋め込む形（font は親から継承、行内表示）
 * - variant='block': リスト行として並ぶ形（独立したフォントサイズ、左寄せ）
 */
interface SearchLinkButtonProps {
  keyword: string;
  onClick: (keyword: string) => void;
  /** title 属性。未指定時は「『<keyword>』を検索」 */
  title?: string;
  /** クリック時に親への伝播を止めるか。エントリ内では true（親の onClick を発火させない）。デフォルト true */
  stopPropagation?: boolean;
  variant?: 'inline' | 'block';
}

const BASE_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--accent)',
  fontWeight: 500,
  textDecoration: 'underline',
  textDecorationStyle: 'dashed',
  textUnderlineOffset: '2px',
};

const INLINE_STYLE: React.CSSProperties = {
  ...BASE_STYLE,
  display: 'inline',
  padding: '0 1px',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontFamily: 'inherit',
};

const BLOCK_STYLE: React.CSSProperties = {
  ...BASE_STYLE,
  flex: 1,
  textAlign: 'left',
  padding: '2px 0',
  fontSize: 14,
  lineHeight: 1.4,
};

export function SearchLinkButton({
  keyword,
  onClick,
  title,
  stopPropagation = true,
  variant = 'inline',
}: SearchLinkButtonProps) {
  const t = useT();
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) e.stopPropagation();
      onClick(keyword);
    },
    [keyword, onClick, stopPropagation],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title ?? t('common.searchKeyword', { label: t('common.quoted', { label: keyword }) })}
      style={variant === 'block' ? BLOCK_STYLE : INLINE_STYLE}
    >
      {keyword}
    </button>
  );
}
