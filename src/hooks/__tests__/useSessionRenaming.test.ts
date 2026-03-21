import { act, renderHook } from '@testing-library/react';
import type { GameSession } from '@/types/memo';
import { useSessionRenaming } from '../useSessionRenaming';

function makeSession(overrides: Partial<GameSession> & { id: string; name: string }): GameSession {
  return {
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
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
    act(() =>
      result.current.handleKeyDown({ key: 'Escape' } as React.KeyboardEvent),
    );

    expect(result.current.isRenaming).toBe(false);
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
