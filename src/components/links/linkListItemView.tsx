import { SearchLinkButton } from '@/components/common/searchLinkButton';
import { Trash2 } from '@/components/icons';
import { useT } from '@/i18n';

interface LinkListItemViewProps {
  /** リンク辞書のキーワード文字列 */
  keyword: string;
  /** キーワードクリック時のハンドラ（呼び出し側で検索を起動する） */
  onClick?: (keyword: string) => void;
  /** 削除ボタンクリック時のハンドラ */
  onRemove?: (keyword: string) => void;
}

/**
 * リンク一覧モーダルの 1 行（キーワード + 削除ボタン）の純粋表示版。
 *
 * - `SearchLinkButton` の block バリエーション + 削除ボタンの組み合わせ
 * - `useStore` には触れず、props で全データを受ける
 */
export function LinkListItemView({ keyword, onClick, onRemove }: LinkListItemViewProps) {
  const t = useT();

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <SearchLinkButton
        keyword={keyword}
        onClick={(k) => onClick?.(k)}
        stopPropagation={false}
        variant="block"
      />
      <button
        onClick={() => onRemove?.(keyword)}
        aria-label={t('links.removeAriaLabel', {
          name: t('common.quoted', { label: keyword }),
        })}
        title={t('common.delete')}
        className="btn-ghost btn-sm"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          color: 'var(--text-muted)',
        }}
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
