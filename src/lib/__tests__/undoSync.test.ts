import type { StoreState } from '@/store/index';
import { syncStateToIdb } from '../undoSync';

// idb モジュールのモック
const mockClearSessionData = vi.fn().mockResolvedValue(undefined);
const mockBulkPutEntries = vi.fn().mockResolvedValue(undefined);
const mockBulkPutCharacters = vi.fn().mockResolvedValue(undefined);
const mockBulkPutTimelineGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutMemoGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutDeductions = vi.fn().mockResolvedValue(undefined);
const mockBulkPutRelations = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  clearSessionData: (...args: unknown[]) => mockClearSessionData(...args),
  bulkPutEntries: (...args: unknown[]) => mockBulkPutEntries(...args),
  bulkPutCharacters: (...args: unknown[]) => mockBulkPutCharacters(...args),
  bulkPutTimelineGroups: (...args: unknown[]) => mockBulkPutTimelineGroups(...args),
  bulkPutMemoGroups: (...args: unknown[]) => mockBulkPutMemoGroups(...args),
  bulkPutDeductions: (...args: unknown[]) => mockBulkPutDeductions(...args),
  bulkPutRelations: (...args: unknown[]) => mockBulkPutRelations(...args),
}));

function makeState(overrides: Partial<StoreState> = {}): StoreState {
  return {
    activeSessionId: 'session-1',
    entries: [{ id: 'e1' }],
    characters: [{ id: 'c1' }],
    timelineGroups: [{ id: 'tg1' }],
    memoGroups: [{ id: 'mg1' }],
    deductions: [{ id: 'd1' }],
    relations: [{ id: 'r1' }],
    ...overrides,
  } as unknown as StoreState;
}

describe('syncStateToIdb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activeSessionId が null なら何もしない', async () => {
    await syncStateToIdb(makeState({ activeSessionId: null }));
    expect(mockClearSessionData).not.toHaveBeenCalled();
    expect(mockBulkPutEntries).not.toHaveBeenCalled();
  });

  it('最初に clearSessionData を呼ぶ', async () => {
    await syncStateToIdb(makeState());
    expect(mockClearSessionData).toHaveBeenCalledWith('session-1');
  });

  it('全ストアの bulk put を呼ぶ', async () => {
    const state = makeState();
    await syncStateToIdb(state);
    expect(mockBulkPutEntries).toHaveBeenCalledWith(state.entries, 'session-1');
    expect(mockBulkPutCharacters).toHaveBeenCalledWith(state.characters, 'session-1');
    expect(mockBulkPutTimelineGroups).toHaveBeenCalledWith(state.timelineGroups);
    expect(mockBulkPutMemoGroups).toHaveBeenCalledWith(state.memoGroups);
    expect(mockBulkPutDeductions).toHaveBeenCalledWith(state.deductions);
    expect(mockBulkPutRelations).toHaveBeenCalledWith(state.relations);
  });

  it('clearSessionData → bulk put の順序で実行される', async () => {
    const callOrder: string[] = [];
    mockClearSessionData.mockImplementation(async () => { callOrder.push('clear'); });
    mockBulkPutEntries.mockImplementation(async () => { callOrder.push('entries'); });

    await syncStateToIdb(makeState());
    expect(callOrder[0]).toBe('clear');
    expect(callOrder).toContain('entries');
  });
});
