import type { GameSession } from '@/types/memo';
import { act, renderHook } from '@testing-library/react';
import { useSessionRenaming } from '../useSessionRenaming';

function makeSession(overrides: Partial<GameSession> & { id: string; name: string }): GameSession {
  return {
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/** keydown モック生成（nativeEvent.isComposing と blur 可能な target を持たせる） */
function keyEvent(key: string, isComposing = false): React.KeyboardEvent {
  return {
    key,
    shiftKey: false,
    nativeEvent: { isComposing },
    target: { blur: vi.fn() },
  } as unknown as React.KeyboardEvent;
}

describe('useSessionRenaming', () => {
  const renameSession = vi.fn().mockResolvedValue(undefined);
  const sessions = [
    makeSession({ id: 's1', name: 'セッション 1' }),
    makeSession({ id: 's2', name: 'セッション 2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startRenaming でアクティブセッション名が renameValue にセットされる', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());

    expect(result.current.isRenaming).toBe(true);
    expect(result.current.renameValue).toBe('セッション 1');
  });

  it('handleBlur で有効な値が保存される', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());
    act(() => result.current.setRenameValue('新しい名前'));
    act(() => result.current.handleBlur());

    expect(renameSession).toHaveBeenCalledWith('s1', '新しい名前');
    expect(result.current.isRenaming).toBe(false);
  });

  it('handleBlur で空文字の場合は renameSession が呼ばれない', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());
    act(() => result.current.setRenameValue('   '));
    act(() => result.current.handleBlur());

    expect(renameSession).not.toHaveBeenCalled();
  });

  it('handleKeyDown Escape で isRenaming=false になる', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());
    act(() => result.current.handleKeyDown(keyEvent('Escape')));

    expect(result.current.isRenaming).toBe(false);
  });

  it('handleKeyDown Enter（変換確定でない）で blur が呼ばれる', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());
    const e = keyEvent('Enter');
    act(() => result.current.handleKeyDown(e));

    expect((e.target as unknown as { blur: ReturnType<typeof vi.fn> }).blur).toHaveBeenCalled();
  });

  // 回帰防止 (#10): IME 変換確定の Enter（isComposing=true）では blur（=保存）しない
  it('handleKeyDown IME 変換中の Enter では blur しない', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: 's1', renameSession }),
    );
    act(() => result.current.startRenaming());
    const e = keyEvent('Enter', true);
    act(() => result.current.handleKeyDown(e));

    expect((e.target as unknown as { blur: ReturnType<typeof vi.fn> }).blur).not.toHaveBeenCalled();
  });

  it('activeSessionId が null の場合は handleBlur で何もしない', () => {
    const { result } = renderHook(() =>
      useSessionRenaming({ sessions, activeSessionId: null, renameSession }),
    );
    act(() => result.current.setRenameValue('テスト'));
    act(() => result.current.handleBlur());

    expect(renameSession).not.toHaveBeenCalled();
  });
});
