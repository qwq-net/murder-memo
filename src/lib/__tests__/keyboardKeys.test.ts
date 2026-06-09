import type { KeyboardEvent } from 'react';

import { isCancelEscape, isCommitEnter } from '../keyboardKeys';

function ev(key: string, opts: { shiftKey?: boolean; isComposing?: boolean } = {}): KeyboardEvent {
  return {
    key,
    shiftKey: opts.shiftKey ?? false,
    nativeEvent: { isComposing: opts.isComposing ?? false },
  } as unknown as KeyboardEvent;
}

describe('isCommitEnter', () => {
  it('通常の Enter は確定とみなす', () => {
    expect(isCommitEnter(ev('Enter'))).toBe(true);
  });

  // IME 変換確定の Enter を入力確定と誤認しない（#10）
  it('IME 変換中の Enter は確定としない', () => {
    expect(isCommitEnter(ev('Enter', { isComposing: true }))).toBe(false);
  });

  it('Shift+Enter は改行扱いで確定としない', () => {
    expect(isCommitEnter(ev('Enter', { shiftKey: true }))).toBe(false);
  });

  it('Enter 以外は false', () => {
    expect(isCommitEnter(ev('a'))).toBe(false);
  });
});

describe('isCancelEscape', () => {
  it('通常の Escape は取消とみなす', () => {
    expect(isCancelEscape(ev('Escape'))).toBe(true);
  });

  // IME 変換中の Escape は変換キャンセルなので編集取消としない（#9）
  it('IME 変換中の Escape は取消としない', () => {
    expect(isCancelEscape(ev('Escape', { isComposing: true }))).toBe(false);
  });

  it('Escape 以外は false', () => {
    expect(isCancelEscape(ev('Enter'))).toBe(false);
  });
});
