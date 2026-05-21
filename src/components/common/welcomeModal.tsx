import { useCallback } from 'react';

import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';
import { APP_VERSION } from '@/lib/version';
import { useStore } from '@/store';

/**
 * 初回起動 / バージョン変更時に表示するウェルカムモーダル。
 *
 * 機能紹介や操作説明は `/guide` ページに移したため、ここでは「概要 3 行 + 導線」に絞る:
 *   - サンプルシナリオが入っている旨
 *   - 使い方ガイドへの誘導（別タブで開く）
 *   - 閉じるボタン
 *
 * バージョンアップ時の通知としての役割は維持（`lastSeenVersion !== APP_VERSION` で表示）。
 */
export function WelcomeModal() {
  const isOpen = useStore((s) => s.isWelcomeOpen);
  const setOpen = useStore((s) => s.setWelcomeOpen);
  const setLastSeenVersion = useStore((s) => s.setLastSeenVersion);

  const handleClose = useCallback(() => {
    setLastSeenVersion(APP_VERSION);
    setOpen(false);
  }, [setLastSeenVersion, setOpen]);

  return (
    <ModalFrame open={isOpen} onClose={handleClose} width={480} ariaLabel="マダめもくんへようこそ">
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.svg" alt="" width="22" height="22" />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
            }}
          >
            マダめもくんへようこそ
          </span>
        </div>
        <button onClick={handleClose} className="modal-close-btn" aria-label="閉じる">
          <X size={18} />
        </button>
      </div>

      {/* 本文 */}
      <div
        style={{
          padding: '16px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          マダめもくんは、マーダーミステリーのプレイ中に使うメモアプリです。
        </p>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          サンプルシナリオがすでに入っているので、まずは触って操作感を確かめてみてください。
          実際のプレイ時はヘッダーの「+」ボタンから新しいセッションを作成できます。
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          ※ 現在は PC での利用を前提とした β バージョンです
        </p>

        {/* バージョン表示 */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-faint)',
            textAlign: 'right',
            letterSpacing: '0.04em',
          }}
        >
          v{APP_VERSION}
        </div>

        {/* アクションボタン */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/guide"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-md"
            style={{ minWidth: 140, textDecoration: 'none', textAlign: 'center' }}
          >
            使い方ガイドを開く
          </a>
          <button onClick={handleClose} className="btn-primary btn-md" style={{ minWidth: 140 }}>
            はじめる
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
