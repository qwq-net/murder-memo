import { act, renderHook } from '@testing-library/react';
import { useGroupLabelEditor } from '../useGroupLabelEditor';

describe('useGroupLabelEditor', () => {
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態は isEditing=false', () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    expect(result.current.isEditing).toBe(false);
  });

  it('startEditing で編集モードに入り、draftLabel が初期値にセットされる', () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    expect(result.current.isEditing).toBe(true);
    expect(result.current.draftLabel).toBe('テスト');
  });

  it('saveLabel で有効な値が保存される', async () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    act(() => result.current.setDraftLabel('新しい名前'));
    await act(async () => result.current.saveLabel());

    expect(onSave).toHaveBeenCalledWith('新しい名前');
    expect(result.current.isEditing).toBe(false);
  });

  it('saveLabel で空白のみの場合は onSave が呼ばれない', async () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    act(() => result.current.setDraftLabel('   '));
    await act(async () => result.current.saveLabel());

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  it('saveLabel で変更なしの場合は onSave が呼ばれない', async () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    await act(async () => result.current.saveLabel());

    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancelEditing で draft がリセットされる', () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    act(() => result.current.setDraftLabel('変更中'));
    act(() => result.current.cancelEditing());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.draftLabel).toBe('テスト');
  });

  it('handleKeyDown Enter で保存される', async () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    act(() => result.current.setDraftLabel('Enter保存'));
    await act(async () => result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent));

    expect(onSave).toHaveBeenCalledWith('Enter保存');
  });

  it('handleKeyDown Escape でキャンセルされる', () => {
    const { result } = renderHook(() =>
      useGroupLabelEditor({ initialLabel: 'テスト', onSave }),
    );
    act(() => result.current.startEditing());
    act(() => result.current.setDraftLabel('変更中'));
    act(() => result.current.handleKeyDown({ key: 'Escape' } as React.KeyboardEvent));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.draftLabel).toBe('テスト');
    expect(onSave).not.toHaveBeenCalled();
  });
});
