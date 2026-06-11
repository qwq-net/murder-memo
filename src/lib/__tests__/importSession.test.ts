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

  // 回帰防止 (#30): 不正な時刻ペアは resolveEventTime を通して整合化される
  it('不正な eventTime のエントリは eventTime/eventTimeSortKey が両方 undefined に正規化される', async () => {
    const data = makeExport({
      entries: [
        {
          id: 'old-e1',
          type: 'timeline',
          content: '不正時刻',
          panel: 'timeline',
          characterTags: [],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 0,
          eventTime: '25:00', // 範囲外
          eventTimeSortKey: 1500,
        },
      ] as unknown as MurderMemoExport['entries'],
    });

    await importSession(fakeFile(data));

    const [entries] = mockBulkPutEntries.mock.calls[0];
    expect(entries[0].eventTime).toBeUndefined();
    expect(entries[0].eventTimeSortKey).toBeUndefined();
  });

  it('正しい eventTime は補完済み文字列と分換算キーに正規化される', async () => {
    const data = makeExport({
      entries: [
        {
          id: 'old-e1',
          type: 'timeline',
          content: '正常時刻',
          panel: 'timeline',
          characterTags: [],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 0,
          eventTime: '9:05',
          eventTimeSortKey: 545,
        },
      ] as unknown as MurderMemoExport['entries'],
    });

    await importSession(fakeFile(data));

    const [entries] = mockBulkPutEntries.mock.calls[0];
    expect(entries[0].eventTime).toBe('9:05');
    expect(entries[0].eventTimeSortKey).toBe(545);
  });

  it('書き込み失敗時は deleteSession でロールバックし、例外を再送出する', async () => {
    mockBulkPutEntries.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(importSession(fakeFile(makeExport()))).rejects.toThrow();
    // 部分書き込みのクリーンアップが1回走る
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
  });

  // ── ダングリング参照の正規化（remap が未知 ID に新 ID を捏造するのを防ぐ） ──

  it('実在しないタイムライングループへの参照は捏造 remap せず未設定に倒す', async () => {
    const data = makeExport({
      timelineGroups: [
        { id: 'old-tg1', sessionId: 'old-s', label: '当日', sortOrder: 0, collapsed: false },
      ],
      entries: [
        {
          id: 'old-e1',
          type: 'timeline',
          content: '正常な参照',
          panel: 'timeline',
          characterTags: [],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 0,
          timelineGroupId: 'old-tg1',
        },
        {
          id: 'old-e2',
          type: 'timeline',
          content: '実在しないグループを参照',
          panel: 'timeline',
          characterTags: [],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 1,
          timelineGroupId: 'ghost-group',
        },
      ] as unknown as MurderMemoExport['entries'],
    });

    await importSession(fakeFile(data));

    const [entries] = mockBulkPutEntries.mock.calls[0];
    const [groups] = mockBulkPutTimelineGroups.mock.calls[0];
    // 実在する参照はグループの新 ID と一致するよう remap される
    expect(entries[0].timelineGroupId).toBe(groups[0].id);
    // 実在しない参照は undefined（タイムラインの「未分類」に表示され、振り分け直せる）
    expect(entries[1].timelineGroupId).toBeUndefined();
  });

  it('timeline 以外のパネルからは timeline 系フィールドと timeline 型を剥がす', async () => {
    const data = makeExport({
      entries: [
        {
          id: 'old-e1',
          type: 'timeline',
          content: 'free なのに timeline 系フィールド持ち',
          panel: 'free',
          characterTags: [],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 0,
          timelineGroupId: 'ghost-group',
          eventTime: '9:00',
          eventTimeSortKey: 540,
        },
      ] as unknown as MurderMemoExport['entries'],
    });

    await importSession(fakeFile(data));

    const [entries] = mockBulkPutEntries.mock.calls[0];
    expect(entries[0].type).toBe('text');
    expect(entries[0].timelineGroupId).toBeUndefined();
    expect(entries[0].eventTime).toBeUndefined();
    expect(entries[0].eventTimeSortKey).toBeUndefined();
  });

  it('実在しないメモグループ・キャラクターへのダングリング参照を掃除する', async () => {
    const data = makeExport({
      memoGroups: [
        {
          id: 'old-mg1',
          sessionId: 'old-s',
          panel: 'free',
          label: 'A',
          sortOrder: 0,
          collapsed: false,
        },
      ],
      entries: [
        {
          id: 'old-e1',
          type: 'text',
          content: 'x',
          panel: 'free',
          characterTags: ['old-c1', 'ghost-char'],
          createdAt: 0,
          updatedAt: 0,
          sortOrder: 0,
          groupId: 'ghost-group',
        },
      ] as unknown as MurderMemoExport['entries'],
      deductions: [
        {
          id: 'old-d1',
          sessionId: 'old-s',
          characterId: 'ghost-char',
          suspicionLevel: 1,
          memo: '',
          updatedAt: 0,
        },
      ] as unknown as MurderMemoExport['deductions'],
      relations: [
        {
          id: 'old-r1',
          sessionId: 'old-s',
          fromCharacterId: 'old-c1',
          toCharacterId: 'ghost-char',
          label: '関係',
          sortOrder: 0,
        },
      ] as unknown as MurderMemoExport['relations'],
    });

    await importSession(fakeFile(data));

    const [entries] = mockBulkPutEntries.mock.calls[0];
    const [chars] = mockBulkPutCharacters.mock.calls[0];
    // 実在しないグループ参照は未分類化、実在しないキャラタグは除去（実在分は remap 済みで残る）
    expect(entries[0].groupId).toBeUndefined();
    expect(entries[0].characterTags).toEqual([chars[0].id]);
    // 実在しないキャラクターを指す推理メモ・相関図は取り込まれない（空なので書き込み自体なし）
    expect(mockBulkPutDeductions).not.toHaveBeenCalled();
    expect(mockBulkPutRelations).not.toHaveBeenCalled();
  });
});
