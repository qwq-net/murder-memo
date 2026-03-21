import { useEffect } from 'react';

/**
 * ESC キーの押下を監視してコールバックを実行するフック。
 * ContextMenu, ConfirmModal, SettingsPanel 等で共通利用。
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') callback();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [callback, enabled]);
}
