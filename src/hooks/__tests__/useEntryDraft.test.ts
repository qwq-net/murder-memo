import { act, renderHook } from '@testing-library/react';
import { useEntryDraft } from '../useEntryDraft';

// IndexedDB モック
vi.mock('@/lib/idb', () => ({
  getImage: vi.fn(),
  putImage: vi.fn(),
  getAllSessions: vi.fn().mockResolvedValue([]),
  putSession: vi.fn(),
  deleteSession: vi.fn(),
  clearSessionData: vi.fn(),
  getAllByIndex: vi.fn().mockResolvedValue([]),
  put: vi.fn(),
}));

type DraftValues = { content: string };

describe('useEntryDraft', () => {
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期 draft が currentValues と一致する', () => {
    const { result } = renderHook(() =>
      useEntryDraft<DraftValues>({
        entryId: 'e1',
        currentValues: { content: 'hello' },
        isEditing: false,
        onSave,
      }),
    );
    expect(result.current.draft.content).toBe('hello');
  });

  it('setDraft で部分更新できる', () => {
    const { result } = renderHook(() =>
      useEntryDraft<DraftValues>({
        entryId: 'e1',
        currentValues: { content: 'hello' },
        isEditing: true,
        onSave,
      }),
    );
    act(() => result.current.setDraft({ content: 'updated' }));
    expect(result.current.draft.content).toBe('updated');
  });

  it('非編集時に currentValues が変わると draft が同期される', () => {
    const { result, rerender } = renderHook(
      ({ currentValues, isEditing }: { currentValues: DraftValues; isEditing: boolean }) =>
        useEntryDraft<DraftValues>({
          entryId: 'e1',
          currentValues,
          isEditing,
          onSave,
        }),
      { initialProps: { currentValues: { content: 'v1' }, isEditing: false } },
    );
    expect(result.current.draft.content).toBe('v1');

    rerender({ currentValues: { content: 'v2' }, isEditing: false });
    expect(result.current.draft.content).toBe('v2');
  });

  it('編集中に currentValues が変わっても draft は同期されない', () => {
    const { result, rerender } = renderHook(
      ({ currentValues, isEditing }: { currentValues: DraftValues; isEditing: boolean }) =>
        useEntryDraft<DraftValues>({
          entryId: 'e1',
          currentValues,
          isEditing,
          onSave,
        }),
      { initialProps: { currentValues: { content: 'v1' }, isEditing: true } },
    );
    act(() => result.current.setDraft({ content: 'editing' }));

    rerender({ currentValues: { content: 'v2' }, isEditing: true });
    expect(result.current.draft.content).toBe('editing');
  });

  it('handleBlur で onSave が呼ばれる', () => {
    const { result } = renderHook(() =>
      useEntryDraft<DraftValues>({
        entryId: 'e1',
        currentValues: { content: 'hello' },
        isEditing: true,
        onSave,
      }),
    );
    act(() => result.current.setDraft({ content: 'saved' }));
    act(() => result.current.handleBlur());

    expect(onSave).toHaveBeenCalledWith({ content: 'saved' });
  });

  it('handleEscape 後の handleBlur では onSave が呼ばれない', () => {
    const { result } = renderHook(() =>
      useEntryDraft<DraftValues>({
        entryId: 'e1',
        currentValues: { content: 'hello' },
        isEditing: true,
        onSave,
      }),
    );
    act(() => result.current.handleEscape());
    expect(result.current.cancelledRef.current).toBe(true);

    act(() => result.current.handleBlur());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('handleEscape で draft がリセットされる', () => {
    const { result } = renderHook(() =>
      useEntryDraft<DraftValues>({
        entryId: 'e1',
        currentValues: { content: 'original' },
        isEditing: true,
        onSave,
      }),
    );
    act(() => result.current.setDraft({ content: 'changed' }));
    act(() => result.current.handleEscape());

    expect(result.current.draft.content).toBe('original');
  });
});
