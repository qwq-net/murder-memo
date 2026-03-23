import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { X } from '@/components/icons';
import { useStore } from '@/store';
import type { ToastItem, ToastType } from '@/store/slices/ui';

const TOAST_DURATION = 3000;
const EXIT_ANIMATION_MS = 200;

/** トーストタイプ別の左ボーダー色 */
const ACCENT: Record<ToastType, string> = {
  info: 'var(--accent)',
  success: 'var(--success)',
  error: 'var(--danger)',
};

// ─── 個別トースト ─────────────────────────────────────────────────────────────

function ToastMessage({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), EXIT_ANIMATION_MS);
  }, [toast.id, onRemove]);

  // 自動消去
  useEffect(() => {
    const timer = setTimeout(dismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${ACCENT[toast.type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px 10px 14px',
        boxShadow: '0 4px 20px var(--shadow-menu)',
        maxWidth: 360,
        minWidth: 200,
        fontSize: 14,
        color: 'var(--text-primary)',
        pointerEvents: 'auto',
        animation: exiting
          ? `toast-out ${EXIT_ANIMATION_MS}ms ease-in forwards`
          : 'toast-in 0.25s ease-out',
      }}
    >
      <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
      <button
        onClick={dismiss}
        aria-label="閉じる"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'color 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── トーストコンテナ ─────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>,
    document.body,
  );
}
