import { useCallback } from 'react';

import { APP_VERSION } from '@/lib/version';
import { useStore } from '@/store';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';

export function WelcomeModal() {
  const isOpen = useStore((s) => s.isWelcomeOpen);
  const setOpen = useStore((s) => s.setWelcomeOpen);
  const setLastSeenVersion = useStore((s) => s.setLastSeenVersion);

  const handleClose = useCallback(() => {
    setLastSeenVersion(APP_VERSION);
    setOpen(false);
  }, [setLastSeenVersion, setOpen]);

  return (
    <ModalFrame
      open={isOpen}
      onClose={handleClose}
      width={520}
      ariaLabel="マダめもくんへようこそ"
    >
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
            マダめもくんへようこそ！
          </span>
        </div>
        <button onClick={handleClose} className="modal-close-btn">
          <X size={18} />
        </button>
      </div>

      {/* 本文 */}
      <div
        style={{
          padding: '16px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* アプリ概要 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            マダめもくんとは？
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            マーダーミステリーのプレイ中に使える、メモ特化のWebアプリです。
            タイムライン・フリーメモ・自分用メモの3つのパネルで情報を整理し、
            推理をスムーズに進められます。
          </p>
        </section>

        {/* サンプルシナリオ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            サンプルシナリオを用意しました
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            すでにサンプルデータが入った状態で表示されています。
            メモの追加・編集・並び替え・削除など、まずは自由に触って操作感を確かめてみてください。
            実際のプレイ時は、ヘッダーの「+」ボタンから新しいセッションを作成して始められます。
          </p>
        </section>

        {/* 設定の案内 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            カスタマイズ
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            ヘッダー右上の「アプリ設定」から、入力欄の位置・パネルの並び順・
            関連人物マーカーの表示形式など、お好みに合わせて調整できます。
          </p>
        </section>

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

        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="btn-primary btn-lg"
          style={{ alignSelf: 'center', minWidth: 160 }}
        >
          はじめる
        </button>
      </div>
    </ModalFrame>
  );
}
