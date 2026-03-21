import { renderHook } from '@testing-library/react';
import { useImageBlob } from '../useImageBlob';

// IndexedDB モック
vi.mock('@/lib/idb', () => ({
  getImage: vi.fn(),
  putImage: vi.fn(),
  deleteImage: vi.fn(),
  getAllSessions: vi.fn().mockResolvedValue([]),
  putSession: vi.fn(),
  deleteSession: vi.fn(),
  clearSessionData: vi.fn(),
}));

const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeAll(() => {
  globalThis.URL.createObjectURL = mockCreateObjectURL;
  globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useImageBlob', () => {
  it('blobKey がある場合、getImage で取得した blob の Object URL を返す', async () => {
    const { getImage } = await import('@/lib/idb');
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.mocked(getImage).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useImageBlob('key-1'));

    // 非同期で URL が設定される
    await vi.waitFor(() => {
      expect(result.current).toBe('blob:mock-url');
    });
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('blobKey が undefined の場合は null を返す', () => {
    const { result } = renderHook(() => useImageBlob(undefined));
    expect(result.current).toBeNull();
  });

  it('blobKey が変わると古い URL が revoke される', async () => {
    const { getImage } = await import('@/lib/idb');
    vi.mocked(getImage).mockResolvedValue(new Blob(['test']));

    const { result, rerender } = renderHook(
      ({ blobKey }: { blobKey?: string }) => useImageBlob(blobKey),
      { initialProps: { blobKey: 'key-1' } },
    );

    await vi.waitFor(() => {
      expect(result.current).toBe('blob:mock-url');
    });

    // blobKey を変更すると cleanup が走り revokeObjectURL が呼ばれる
    rerender({ blobKey: 'key-2' });

    await vi.waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  it('getImage が null を返した場合は URL を設定しない', async () => {
    const { getImage } = await import('@/lib/idb');
    vi.mocked(getImage).mockResolvedValue(undefined as unknown as Blob);

    const { result } = renderHook(() => useImageBlob('missing-key'));

    // 少し待っても null のまま
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current).toBeNull();
  });
});
