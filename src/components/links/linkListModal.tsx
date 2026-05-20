import { useCallback, useMemo, useState } from 'react';

import { useStore } from '@/store';
import type { LinkKeyword } from '@/types/memo';
import { ConfirmModal } from '@/components/common/confirmModal';
import { ModalFrame } from '@/components/common/modalFrame';
import { SearchLinkButton } from '@/components/common/searchLinkButton';
import { Trash2, X } from '@/components/icons';

/**
 * 登録済みリンクキーワード辞書の一覧モーダル。
 *
 * - 各行のキーワードをクリック → 既存の SearchOverlay を `openSearchWith` で起動
 * - 各行の削除アイコン → ConfirmModal で確認したうえで辞書から削除
 *   （削除しても本文中の `[キーワード]` 明示形式は引き続きリンクとして機能する）
 */
export function LinkListModal() {
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
      <ModalFrame open={isOpen} onClose={() => setOpen(false)} width={440} ariaLabel="リンク一覧">
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 10px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            リンク一覧
          </span>
          <button onClick={() => setOpen(false)} className="modal-close-btn" aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '4px 18px 18px' }}>
          {sorted.length === 0 ? (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              リンクが登録されていません
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                メモに <code>[テキスト]</code> 形式で書いて確定すると自動で登録されます
              </span>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {sorted.map((kw) => (
                <li
                  key={kw.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* キーワード（クリックで検索） */}
                  <SearchLinkButton
                    keyword={kw.keyword}
                    onClick={handleClickKeyword}
                    stopPropagation={false}
                    variant="block"
                  />

                  {/* 削除ボタン */}
                  <button
                    onClick={() => setPendingDelete(kw)}
                    aria-label={`「${kw.keyword}」を削除`}
                    title="削除"
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
            ? `「${pendingDelete.keyword}」を辞書から削除しますか？`
            : ''
        }
        actions={[
          {
            label: '削除',
            color: 'var(--importance-high)',
            onClick: handleConfirmDelete,
          },
        ]}
      />
    </>
  );
}
