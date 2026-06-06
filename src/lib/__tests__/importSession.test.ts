import type { MurderMemoExport } from '@/types/memo';
import { EXPORT_VERSION } from '@/types/memo';

// importSession が呼ぶ idb 書き込み系をモック（get* は import 解決のためのダミー）
const mockPutSession = vi.fn().mockResolvedValue(undefined);
const mockBulkPutCharacters = vi.fn().mockResolvedValue(undefined);
const mockBulkPutTimelineGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutMemoGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutEntries = vi.fn().mockResolvedValue(undefined);
const mockBulkPutDeductions = vi.fn().mockResolvedValue(undefined);
const mockBulkPutRelations = vi.fn().mockResolvedValue(undefined);
const mockBulkPutLinkKeywords = vi.fn().mockResolvedValue(undefined);
const mockPutImage = vi.fn().mockResolvedValue(undefined);
const mockDeleteSession = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  putSession: (...a: unknown[]) => mockPutSession(...a),
  bulkPutCharacters: (...a: unknown[]) => mockBulkPutCharacters(...a),
  bulkPutTimelineGroups: (...a: unknown[]) => mockBulkPutTimelineGroups(...a),
  bulkPutMemoGroups: (...a: unknown[]) => mockBulkPutMemoGroups(...a),
  bulkPutEntries: (...a: unknown[]) => mockBulkPutEntries(...a),
  bulkPutDeductions: (...a: unknown[]) => mockBulkPutDeductions(...a),
  bulkPutRelations: (...a: unknown[]) => mockBulkPutRelations(...a),
  bulkPutLinkKeywords: (...a: unknown[]) => mockBulkPutLinkKeywords(...a),
  putImage: (...a: unknown[]) => mockPutImage(...a),
  deleteSession: (...a: unknown[]) => mockDeleteSession(...a),
  getEntriesBySession: vi.fn(),
  getCharactersBySession: vi.fn(),
  getTimelineGroupsBySession: vi.fn(),
  getMemoGroupsBySession: vi.fn(),
  getDeductionsBySession: vi.fn(),
  getRelationsBySession: vi.fn(),
  getLinkKeywordsBySession: vi.fn(),
  getImage: vi.fn(),
}));

vi.mock('nanoid', () => {
  let n = 0;
  return { nanoid: () => `new-${++n}` };
});

import { importSession } from '../exportImport';

function makeExport(overrides: Partial<MurderMemoExport> = {}): MurderMemoExport {
  return {
    version: EXPORT_VERSION,
    exportedAt: 0,
    session: { id: 'old-s', name: 'インポート元', createdAt: 0, updatedAt: 0 },
    entries: [
      {
        id: 'old-e1',
        type: 'text',
        content: 'メモ',
        panel: 'free',
        characterTags: ['old-c1'],
        createdAt: 0,
        updatedAt: 0,
        sortOrder: 0,
      },
    ],
    characters: [
      { id: 'old-c1', name: '医者', color: '#fff', sortOrder: 0, role: 'pl', showInEntries: true },
    ],
    timelineGroups: [],
    memoGroups: [],
    images: [],
    ...overrides,
  };
}

function fakeFile(data: unknown): File {
  return { text: () => Promise.resolve(JSON.stringify(data)) } as unknown as File;
}

describe('importSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('新セッションとして取り込み、全 ID を新規採番する', async () => {
    const result = await importSession(fakeFile(makeExport()));

    expect(result.name).toBe('インポート元');
    expect(result.id).not.toBe('old-s'); // 振り直されている
    expect(mockPutSession).toHaveBeenCalledTimes(1);
    expect(mockBulkPutEntries).toHaveBeenCalledTimes(1);

    // characterTags の参照も新 ID に張り替えられ、元 ID は残らない
    const [entries] = mockBulkPutEntries.mock.calls[0];
    expect(entries[0].id).not.toBe('old-e1');
    expect(entries[0].characterTags[0]).not.toBe('old-c1');
  });

  it('不正な JSON は弾いて throw する', async () => {
    const badFile = { text: () => Promise.resolve('{ not json') } as unknown as File;
    await expect(importSession(badFile)).rejects.toThrow();
    expect(mockPutSession).not.toHaveBeenCalled();
  });

  it('形式不正（必須配列の欠落）は弾いて throw する', async () => {
    const bad = makeExport();
    delete (bad as { entries?: unknown }).entries;
    await expect(importSession(fakeFile(bad))).rejects.toThrow();
    expect(mockPutSession).not.toHaveBeenCalled();
  });

  it('role / showInEntries を欠く旧キャラに既定値を補完する', async () => {
    const data = makeExport({
      characters: [
        { id: 'old-c1', name: '探偵', color: '#000', sortOrder: 0 },
      ] as unknown as MurderMemoExport['characters'],
    });

    await importSession(fakeFile(data));

    const [chars] = mockBulkPutCharacters.mock.calls[0];
    expect(chars[0].role).toBe('pl');
    expect(chars[0].showInEntries).toBe(true);
  });

  it('書き込み失敗時は deleteSession でロールバックし、例外を再送出する', async () => {
    mockBulkPutEntries.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(importSession(fakeFile(makeExport()))).rejects.toThrow();
    // 部分書き込みのクリーンアップが1回走る
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
  });
});
