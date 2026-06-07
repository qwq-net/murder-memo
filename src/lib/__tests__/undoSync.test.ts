import type { StoreState } from '@/store/index';
import { syncStateToIdb } from '../undoSync';

// idb モジュールのモック。syncStateToIdb は単一トランザクションの replaceSessionData に委譲する。
const mockReplaceSessionData = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  replaceSessionData: (...args: unknown[]) => mockReplaceSessionData(...args),
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
    linkKeywords: [{ id: 'lk1' }],
    ...overrides,
  } as unknown as StoreState;
}

describe('syncStateToIdb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activeSessionId が null なら何もしない', async () => {
    await syncStateToIdb(makeState({ activeSessionId: null }));
    expect(mockReplaceSessionData).not.toHaveBeenCalled();
  });

  // replaceSessionData は削除→書き戻しを単一トランザクションで行う。
  // これにより「clear は成功したが bulkPut が失敗してストアが空のまま確定」する旧バグを防ぐ。
  it('replaceSessionData に全 TrackedState + linkKeywords を渡して委譲する', async () => {
    const state = makeState();
    await syncStateToIdb(state);
    expect(mockReplaceSessionData).toHaveBeenCalledTimes(1);
    const [data, sid] = mockReplaceSessionData.mock.calls[0];
    expect(sid).toBe('session-1');
    expect(data).toEqual({
      entries: state.entries,
      characters: state.characters,
      timelineGroups: state.timelineGroups,
      memoGroups: state.memoGroups,
      deductions: state.deductions,
      relations: state.relations,
      // 回帰防止: linkKeywords は TrackedState 外だが書き戻さないと辞書が失われる
      linkKeywords: state.linkKeywords,
    });
  });

  // 回帰防止: 書き戻しが失敗したら呼び手が検知できるよう throw する（黙殺しない）。
  // 単一トランザクションのため IDB 側はロールバックされ「空のまま確定」しない。
  it('replaceSessionData が reject したら throw する（呼び手が通知できるように）', async () => {
    mockReplaceSessionData.mockRejectedValueOnce(new Error('IDB error'));
    await expect(syncStateToIdb(makeState())).rejects.toThrow('IDB error');
  });
});
