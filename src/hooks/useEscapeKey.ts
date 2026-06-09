import { useEffect, useRef } from 'react';

/**
 * ESC キーの押下を監視してコールバックを実行するフック。
 * ContextMenu, ConfirmModal, SettingsPanel, ModalFrame 等で共通利用。
 *
 * 複数のモーダルが重なっている場合（例: SettingsPanel 上に ConfirmModal）、1 回の ESC で
 * **最前面（最後に登録された）1 つだけ** を閉じる。各インスタンスが個別に document リスナーを
 * 張ると ESC で全モーダルが同時に閉じてしまうため、登録順のスタックを共有し、ESC では
 * スタック最上段のコールバックのみを実行する。
 */
const escapeStack: Array<() => void> = [];
let listenerAttached = false;

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  const top = escapeStack[escapeStack.length - 1];
  if (top) top();
}

export function useEscapeKey(callback: () => void, enabled = true) {
  // 最新の callback を参照しつつ、スタック登録は安定参照にする
  // （callback の identity 変化でスタック順が乱れないよう ref 経由で呼ぶ）
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    const entry = () => callbackRef.current();
    escapeStack.push(entry);
    if (!listenerAttached) {
      document.addEventListener('keydown', handleGlobalKeydown);
      listenerAttached = true;
    }
    return () => {
      const idx = escapeStack.lastIndexOf(entry);
      if (idx !== -1) escapeStack.splice(idx, 1);
      if (escapeStack.length === 0 && listenerAttached) {
        document.removeEventListener('keydown', handleGlobalKeydown);
        listenerAttached = false;
      }
    };
  }, [enabled]);
}
