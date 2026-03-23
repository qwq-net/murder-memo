import { renderHook } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';

// syncStateToIdb をモック
const mockSyncStateToIdb = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/undoSync', () => ({
  syncStateToIdb: (...args: unknown[]) => mockSyncStateToIdb(...args),
}));

// useStore をモック
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockAddToast = vi.fn();
const mockGetTemporalState = vi.fn();
const mockGetState = vi.fn();

vi.mock('@/store', () => ({
  useStore: Object.assign(vi.fn(), {
    temporal: {
      getState: () => mockGetTemporalState(),
    },
    getState: () => mockGetState(),
  }),
}));

function fireKeydown(key: string, opts: Partial<KeyboardEvent> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    ...opts,
  });
  document.dispatchEvent(event);
}

describe('useUndoRedo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemporalState.mockReturnValue({
      pastStates: [{}],
      futureStates: [{}],
      undo: mockUndo,
      redo: mockRedo,
    });
    mockGetState.mockReturnValue({
      entries: [],
      characters: [],
      timelineGroups: [],
      memoGroups: [],
      deductions: [],
      relations: [],
      addToast: mockAddToast,
    });
  });

  it('Ctrl+Z で undo を呼ぶ', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true });
    expect(mockUndo).toHaveBeenCalledOnce();
  });

  it('Ctrl+Shift+Z で redo を呼ぶ', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true, shiftKey: true });
    expect(mockRedo).toHaveBeenCalledOnce();
  });

  it('Ctrl+Y で redo を呼ぶ', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('y', { ctrlKey: true });
    expect(mockRedo).toHaveBeenCalledOnce();
  });

  it('pastStates が空の場合 undo は呼ばれない', () => {
    mockGetTemporalState.mockReturnValue({
      pastStates: [],
      futureStates: [{}],
      undo: mockUndo,
      redo: mockRedo,
    });
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true });
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('futureStates が空の場合 redo は呼ばれない', () => {
    mockGetTemporalState.mockReturnValue({
      pastStates: [{}],
      futureStates: [],
      undo: mockUndo,
      redo: mockRedo,
    });
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true, shiftKey: true });
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('INPUT 要素にフォーカス中は無視される', () => {
    renderHook(() => useUndoRedo());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);
    expect(mockUndo).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('TEXTAREA 要素にフォーカス中は無視される', () => {
    renderHook(() => useUndoRedo());
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    textarea.dispatchEvent(event);
    expect(mockUndo).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('undo 後に syncStateToIdb が呼ばれる', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true });
    expect(mockSyncStateToIdb).toHaveBeenCalledOnce();
  });

  it('undo 後にトーストが表示される', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('z', { ctrlKey: true });
    expect(mockAddToast).toHaveBeenCalledOnce();
    expect(mockAddToast.mock.calls[0][0]).toContain('元に戻しました');
  });

  it('修飾キーなしの z では何もしない', () => {
    renderHook(() => useUndoRedo());
    fireKeydown('z');
    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('アンマウント後にリスナーが削除される', () => {
    const { unmount } = renderHook(() => useUndoRedo());
    unmount();
    fireKeydown('z', { ctrlKey: true });
    expect(mockUndo).not.toHaveBeenCalled();
  });
});
