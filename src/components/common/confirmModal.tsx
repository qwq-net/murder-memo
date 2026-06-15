import { useState } from 'react';

import { ModalFrame } from '@/components/common/modalFrame';
import { useT } from '@/i18n';

// ─── 型定義 ─────────────────────────────────────────────────────────────────

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
  /** 取り消しボタンのラベル。省略時は共通の「キャンセル」訳。 */
  cancelLabel?: string;
}

// ─── コンポーネント ─────────────────────────────────────────────────────────

export function ConfirmModal({
  open,
  onClose,
  title,
  confirmationLabel,
  actions,
  cancelLabel,
}: ConfirmModalProps) {
  const t = useT();
  const [confirmed, setConfirmed] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // 開くたびにリセット
  if (open && !prevOpen) {
    setConfirmed(false);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  return (
    <ModalFrame open={open} onClose={onClose} ariaLabel={title} role="alertdialog" zIndex={100}>
      <div
        aria-describedby={confirmationLabel ? 'confirm-modal-desc' : undefined}
        className="flex flex-col gap-4 p-5"
        style={{ minWidth: 300, maxWidth: 400 }}
      >
        {/* タイトル */}
        <div className="text-text-primary text-sm leading-normal font-semibold">{title}</div>

        {/* トグル確認 */}
        {confirmationLabel && (
          <label
            id="confirm-modal-desc"
            className="flex cursor-pointer items-start gap-2 leading-relaxed transition-colors select-none"
            style={{
              color: confirmed ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            {/* トグル */}
            <span
              className="relative mt-px inline-block shrink-0 transition-colors duration-200"
              style={{
                width: 32,
                height: 18,
                borderRadius: 9,
                background: confirmed ? 'var(--color-settings-accent)' : 'var(--border-strong)',
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                aria-label={confirmationLabel}
                className="absolute m-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full transition-[left] duration-200"
                style={{
                  top: 2,
                  left: confirmed ? 16 : 2,
                  width: 14,
                  height: 14,
                  background: 'var(--text-primary)',
                }}
              />
            </span>
            {confirmationLabel}
          </label>
        )}

        {/* ボタン群 */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-ghost btn-lg"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {cancelLabel ?? t('common.cancel')}
          </button>

          {actions.map((action, i) => {
            const disabled = action.requiresConfirmation && confirmationLabel && !confirmed;
            const color = action.color ?? 'var(--color-settings-accent)';
            return (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                disabled={!!disabled}
                className="btn-lg"
                style={{
                  background: disabled ? 'var(--border-subtle)' : color,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: disabled ? 'var(--text-faint)' : 'var(--bg-base)',
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
    </ModalFrame>
  );
}
