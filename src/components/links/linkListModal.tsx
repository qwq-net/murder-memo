import { useCallback, useMemo, useState } from 'react';

import { ConfirmModal } from '@/components/common/confirmModal';
import { ModalEmptyMessage } from '@/components/common/modalEmptyMessage';
import { ModalFrame } from '@/components/common/modalFrame';
import { ModalHeader } from '@/components/common/modalHeader';
import { LinkListItemView } from '@/components/links/linkListItemView';
import { useT } from '@/i18n';
import { useStore } from '@/store';
import type { LinkKeyword } from '@/types/memo';

/**
 * 登録済みリンクキーワード辞書の一覧モーダル。
 *
 * - 各行のキーワードをクリック → 既存の SearchOverlay を `openSearchWith` で起動
 * - 各行の削除アイコン → ConfirmModal で確認したうえで辞書から削除
 *   （削除しても本文中の `[キーワード]` 明示形式は引き続きリンクとして機能する）
 */
export function LinkListModal() {
  const t = useT();
  const isOpen = useStore((s) => s.isLinkListOpen);
  const setOpen = useStore((s) => s.setLinkListOpen);
  const linkKeywords = useStore((s) => s.linkKeywords);
  const removeLinkKeyword = useStore((s) => s.removeLinkKeyword);
  const openSearchWith = useStore((s) => s.openSearchWith);

  // 新しい登録ほど先に来るよう createdAt 降順で並べる
  const sorted = useMemo(
    () => [...linkKeywords].sort((a, b) => b.createdAt - a.createdAt),
    [linkKeywords],
  );

  const [pendingDelete, setPendingDelete] = useState<LinkKeyword | null>(null);

  const handleClickKeyword = useCallback(
    (keyword: string) => {
      openSearchWith(keyword);
      setOpen(false);
    },
    [openSearchWith, setOpen],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    void removeLinkKeyword(pendingDelete.id);
  }, [pendingDelete, removeLinkKeyword]);

  return (
    <>
      <ModalFrame
        open={isOpen}
        onClose={() => setOpen(false)}
        width={440}
        ariaLabel={t('links.heading')}
      >
        {/* ヘッダー */}
        <ModalHeader title={t('links.heading')} onClose={() => setOpen(false)} />

        {/* ボディ */}
        <div style={{ padding: '4px 18px 18px' }}>
          {sorted.length === 0 ? (
            <ModalEmptyMessage style={{ lineHeight: 1.6 }}>
              {t('links.empty')}
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                {t('links.emptyHintPre')}
                <code>{t('links.emptyHintCode')}</code>
                {t('links.emptyHintPost')}
              </span>
            </ModalEmptyMessage>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sorted.map((kw) => (
                <LinkListItemView
                  key={kw.id}
                  keyword={kw.keyword}
                  onClick={handleClickKeyword}
                  onRemove={() => setPendingDelete(kw)}
                />
              ))}
            </ul>
          )}
        </div>
      </ModalFrame>

      {/* 削除確認 */}
      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={
          pendingDelete
            ? t('links.confirmDeleteTitle', {
                name: t('common.quoted', { label: pendingDelete.keyword }),
              })
            : ''
        }
        actions={[
          {
            label: t('common.delete'),
            color: 'var(--importance-high)',
            onClick: handleConfirmDelete,
          },
        ]}
      />
    </>
  );
}
