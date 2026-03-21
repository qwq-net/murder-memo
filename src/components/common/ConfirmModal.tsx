import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConfirmModalAction {
  label: string;
  /** ボタンの色。省略時は accent */
  color?: string;
  /** true の場合、トグル確認が必要 */
  requiresConfirmation?: boolean;
  onClick: () => void;
}

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** トグル確認テキスト。設定するとトグルONまで requiresConfirmation なボタンが無効になる */
  confirmationLabel?: string;
  /** アクションボタン群（最大3つ）。右寄せで表示 */
  actions: ConfirmModalAction[];
  /** 取り消しボタンのラベル。デフォルト "取り消し" */
  cancelLabel?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ConfirmModal({
  open,
  onClose,
  title,
  confirmationLabel,
  actions,
  cancelLabel = '取り消し',
}: ConfirmModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // 開くたびにリセット
  useEffect(() => {
    if (open) {
      setConfirmed(false);
      requestAnimationFrame(() => firstFocusRef.current?.focus());
    }
  }, [open]);

  // ESC で閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // オーバーレイクリックで閉じる
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={confirmationLabel ? 'confirm-modal-desc' : undefined}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 22px 16px',
          minWidth: 300,
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* タイトル */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          {title}
        </div>

        {/* トグル確認 */}
        {confirmationLabel && (
          <label
            id="confirm-modal-desc"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              lineHeight: 1.6,
              color: confirmed ? 'var(--text-secondary)' : 'var(--text-muted)',
              transition: 'color 0.15s',
              userSelect: 'none',
            }}
          >
            {/* トグル */}
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                width: 32,
                height: 18,
                flexShrink: 0,
                marginTop: 1,
                borderRadius: 9,
                background: confirmed ? '#c45a2a' : 'var(--border-strong)',
                transition: 'background 0.2s',
              }}
            >
              <input
                ref={firstFocusRef as React.RefObject<HTMLInputElement>}
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  margin: 0,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: confirmed ? 16 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--text-primary)',
                  transition: 'left 0.2s',
                  pointerEvents: 'none',
                }}
              />
            </span>
            {confirmationLabel}
          </label>
        )}

        {/* ボタン群 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: 12,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {cancelLabel}
          </button>

          {actions.map((action, i) => {
            const disabled = action.requiresConfirmation && confirmationLabel && !confirmed;
            const color = action.color ?? '#c45a2a';
            return (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                disabled={!!disabled}
                style={{
                  background: disabled ? 'var(--border-subtle)' : color,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: disabled ? 'var(--text-faint)' : 'var(--bg-base)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 14px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s, color 0.15s, opacity 0.15s',
                  opacity: disabled ? 0.7 : 1,
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
