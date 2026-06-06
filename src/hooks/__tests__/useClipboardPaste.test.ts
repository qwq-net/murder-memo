import { renderHook } from '@testing-library/react';
import { useClipboardPaste } from '../useClipboardPaste';

// IndexedDB・nanoid・imageResize モック
vi.mock('@/lib/idb', () => ({
  putImage: vi.fn().mockResolvedValue(undefined),
  getImage: vi.fn(),
  getAllSessions: vi.fn().mockResolvedValue([]),
  putSession: vi.fn(),
  deleteSession: vi.fn(),
  clearSessionData: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-123',
}));

// resizeImage は Blob をそのまま返すモック
vi.mock('@/lib/imageResize', () => ({
  resizeImage: vi.fn((blob: Blob) => Promise.resolve(blob)),
}));

function createPasteEvent(type: string): ClipboardEvent {
  return createMultiPasteEvent([type]);
}

/** 指定 MIME タイプ群の clipboard items を持つ paste イベントを作る */
function createMultiPasteEvent(types: string[]): ClipboardEvent {
  const items = types.map((type) => ({
    type,
    kind: 'file',
    getAsFile: () => new File(['fake'], 'f', { type }),
  }));
  const dataTransfer = { items } as unknown as DataTransfer;
  const event = new Event('paste', { bubbles: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', { value: dataTransfer });
  return event;
}

describe('useClipboardPaste', () => {
  it('画像ペースト時に onImagePaste が呼ばれる', async () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    document.dispatchEvent(createPasteEvent('image/png'));

    await vi.waitFor(() => {
      expect(onPaste).toHaveBeenCalledWith('test-nanoid-123');
    });
  });

  it('enabled=false の場合はペーストを無視する', async () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste, false));

    document.dispatchEvent(createPasteEvent('image/png'));

    await new Promise((r) => setTimeout(r, 50));
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('画像以外の MIME タイプは無視する', async () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    document.dispatchEvent(createPasteEvent('text/plain'));

    await new Promise((r) => setTimeout(r, 50));
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('アンマウント後はリスナーが解除される', async () => {
    const onPaste = vi.fn();
    const { unmount } = renderHook(() => useClipboardPaste(onPaste));
    unmount();

    document.dispatchEvent(createPasteEvent('image/png'));

    await new Promise((r) => setTimeout(r, 50));
    expect(onPaste).not.toHaveBeenCalled();
  });

  it('複数画像のペーストで画像ごとに onImagePaste が呼ばれる', async () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    document.dispatchEvent(createMultiPasteEvent(['image/png', 'image/jpeg']));

    await vi.waitFor(() => {
      expect(onPaste).toHaveBeenCalledTimes(2);
    });
  });

  it('画像と非画像が混在しても画像だけ処理する', async () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    document.dispatchEvent(createMultiPasteEvent(['text/plain', 'image/png']));

    await vi.waitFor(() => {
      expect(onPaste).toHaveBeenCalledTimes(1);
    });
  });

  it('画像があれば preventDefault する', () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    const ev = createMultiPasteEvent(['image/png']);
    const spy = vi.spyOn(ev, 'preventDefault');
    document.dispatchEvent(ev);

    // 画像 Blob は await 前に同期収集するため preventDefault も同期で呼ばれる
    expect(spy).toHaveBeenCalled();
  });

  it('画像が無ければ preventDefault しない', () => {
    const onPaste = vi.fn();
    renderHook(() => useClipboardPaste(onPaste));

    const ev = createMultiPasteEvent(['text/plain']);
    const spy = vi.spyOn(ev, 'preventDefault');
    document.dispatchEvent(ev);

    expect(spy).not.toHaveBeenCalled();
  });
});
