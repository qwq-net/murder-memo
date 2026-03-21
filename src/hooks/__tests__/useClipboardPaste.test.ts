import { renderHook } from '@testing-library/react';
import { useClipboardPaste } from '../useClipboardPaste';

// IndexedDB・nanoid モック
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

function createPasteEvent(type: string): ClipboardEvent {
  const file = new File(['fake-image'], 'image.png', { type });
  const dataTransfer = {
    items: [
      {
        type,
        kind: 'file',
        getAsFile: () => file,
      },
    ],
  } as unknown as DataTransfer;
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
});
