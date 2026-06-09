import type { KeyboardEvent } from 'react';

/**
 * キー操作の判定ヘルパー。Enter/Escape の「確定/取消」判定が各コンポーネントに散在し、
 * 一部で IME 変換中（e.nativeEvent.isComposing）のチェックが抜けていた非対称を解消するため、
 * 判定をここに集約する。
 *
 * 日本語入力では、変換候補確定の Enter / 変換キャンセルの Escape でも keydown が発火する。
 * これらを入力確定・編集取消と誤認すると「変換途中で保存される」「変換キャンセルのつもりが
 * 編集破棄される」といった事故になるため、isComposing 中は確定/取消とみなさない。
 */

/**
 * 「確定」操作の Enter 押下かを判定する。
 * - IME 変換確定の Enter（isComposing）は確定とみなさない
 * - Shift+Enter は改行（複数行入力）扱いなので確定としない（単一行入力でも無害に無視される）
 */
export function isCommitEnter(e: KeyboardEvent): boolean {
  return e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing;
}

/**
 * 「取消」操作の Escape 押下かを判定する。
 * - IME 変換中の Escape は変換キャンセルとして消費されるため取消とみなさない
 */
export function isCancelEscape(e: KeyboardEvent): boolean {
  return e.key === 'Escape' && !e.nativeEvent.isComposing;
}
