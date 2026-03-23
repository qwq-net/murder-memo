import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useEscapeKey } from '@/hooks/useEscapeKey';

/**
 * モーダルフレーム共通コンポーネント。
 * ConfirmModal, CharacterSetupPanel, SettingsPanel で重複していた
 * オーバーレイ + ダイアログ + ESC閉じ + 外側クリック閉じ + フォーカストラップを共通化。
 */

interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  maxHeight?: string;
  children: React.ReactNode;
  ariaLabel: string;
  /** alertdialog にする場合 true（確認モーダル等） */
  role?: 'dialog' | 'alertdialog';
  zIndex?: number;
  /** ポータルを使わずインラインで描画する場合 true */
  inline?: boolean;
}

export function ModalFrame({
  open,
  onClose,
  width,
  maxHeight = '80vh',
  children,
  ariaLabel,
  role = 'dialog',
  zIndex = 50,
  inline,
}: ModalFrameProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 開くときに前のフォーカスを保存、閉じるときに復元
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // 初回フォーカスを少し遅延（レンダリング完了後）
      requestAnimationFrame(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const firstFocusable = dialog.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // ESCで閉じる
  useEscapeKey(onClose, open);

  // オーバーレイクリックで閉じる
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  // フォーカストラップ — Tab循環
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="modal-overlay"
      style={{ zIndex }}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width,
          maxHeight,
          overflowY: 'auto',
          boxShadow: '0 8px 32px var(--shadow-menu)',
        }}
      >
        {children}
      </div>
    </div>
  );

  return inline ? content : createPortal(content, document.body);
}
