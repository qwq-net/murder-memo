import { resizeImage } from '../imageResize';

// OffscreenCanvas と createImageBitmap のモック

function makeMockBitmap(width: number, height: number) {
  return { width, height, close: vi.fn() };
}

const mockCtx = { drawImage: vi.fn() };
const mockConvertToBlob = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  mockCtx.drawImage.mockClear();
  mockConvertToBlob.mockClear();

  vi.stubGlobal('createImageBitmap', vi.fn());

  // OffscreenCanvas は `new` で呼ばれるため class でモックする
  vi.stubGlobal('OffscreenCanvas', class {
    width: number;
    height: number;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
    }
    getContext() { return mockCtx; }
    convertToBlob(...args: unknown[]) { return mockConvertToBlob(...args); }
  });
});

describe('resizeImage', () => {
  it('最大サイズ以内の画像はそのまま返す', async () => {
    const blob = new Blob(['test'], { type: 'image/png' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(800, 600) as never);

    const result = await resizeImage(blob);
    expect(result).toBe(blob);
  });

  it('幅が超過した画像はリサイズされる', async () => {
    const original = new Blob(['test'], { type: 'image/png' });
    const resized = new Blob(['resized'], { type: 'image/jpeg' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(2400, 1200) as never);
    mockConvertToBlob.mockResolvedValue(resized);

    const result = await resizeImage(original, 1200, 1200);
    expect(result).toBe(resized);
    // 2400x1200 → scale 0.5 → 1200x600
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 600);
  });

  it('高さが超過した画像はリサイズされる', async () => {
    const original = new Blob(['test'], { type: 'image/png' });
    const resized = new Blob(['resized'], { type: 'image/jpeg' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(600, 2400) as never);
    mockConvertToBlob.mockResolvedValue(resized);

    const result = await resizeImage(original, 1200, 1200);
    expect(result).toBe(resized);
    // 600x2400 → scale 0.5 → 300x1200
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 300, 1200);
  });

  it('幅・高さ両方超過はアスペクト比を維持して縮小', async () => {
    const original = new Blob(['test'], { type: 'image/png' });
    const resized = new Blob(['resized'], { type: 'image/jpeg' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(3600, 2400) as never);
    mockConvertToBlob.mockResolvedValue(resized);

    const result = await resizeImage(original, 1200, 1200);
    expect(result).toBe(resized);
    // 3600x2400 → scale = min(1200/3600, 1200/2400) = 0.333 → 1200x800
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 800);
  });

  it('ちょうど最大サイズの画像はリサイズされない', async () => {
    const blob = new Blob(['test'], { type: 'image/png' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(1200, 1200) as never);

    const result = await resizeImage(blob, 1200, 1200);
    expect(result).toBe(blob);
  });

  it('カスタム最大サイズを指定できる', async () => {
    const original = new Blob(['test'], { type: 'image/png' });
    const resized = new Blob(['resized'], { type: 'image/jpeg' });
    vi.mocked(createImageBitmap).mockResolvedValue(makeMockBitmap(1000, 500) as never);
    mockConvertToBlob.mockResolvedValue(resized);

    const result = await resizeImage(original, 400, 400);
    expect(result).toBe(resized);
    // 1000x500 → scale = min(0.4, 0.8) = 0.4 → 400x200
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 200);
  });

  it('bitmap.close() が呼ばれる（リサイズあり）', async () => {
    const bitmap = makeMockBitmap(2400, 1200);
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap as never);
    mockConvertToBlob.mockResolvedValue(new Blob());

    await resizeImage(new Blob(), 1200, 1200);
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('bitmap.close() が呼ばれる（リサイズなし）', async () => {
    const bitmap = makeMockBitmap(800, 600);
    vi.mocked(createImageBitmap).mockResolvedValue(bitmap as never);

    await resizeImage(new Blob(), 1200, 1200);
    expect(bitmap.close).toHaveBeenCalled();
  });
});
