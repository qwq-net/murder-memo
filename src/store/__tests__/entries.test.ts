/**
 * entries スライスの本質的な振る舞いを検証する。
 *
 * 重要なドメインルール:
 *   タイムラインから離脱したエントリは timelineGroupId / eventTime / eventTimeSortKey が
 *   完全にクリアされる。これが守られないと、free に移したエントリがタイムラインの
 *   どこかに紐付いたまま残り、エクスポート時や復元時に不整合を起こす。
 */

const mockPutEntry = vi.fn().mockResolvedValue(undefined);
const mockDeleteEntry = vi.fn().mockResolvedValue(undefined);
const mockDeleteImage = vi.fn().mockResolvedValue(undefined);
const mockBulkPutEntries = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  putEntry: (...args: unknown[]) => mockPutEntry(...args),
  deleteEntry: (...args: unknown[]) => mockDeleteEntry(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
  bulkPutEntries: (...args: unknown[]) => mockBulkPutEntries(...args),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
}));

import { useStore } from '@/store/index';
import { makeEntry } from './helpers';

describe('entriesSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      activeSessionId: 'session-test',
      entries: [],
    });
  });

  describe('moveEntryToPanel', () => {
    it('timeline → free に移動するとタイムライン専用フィールドがクリアされる', async () => {
      const entry = makeEntry({
        id: 'e1',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '13:00',
        eventTimeSortKey: 780,
      });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'free');

      const moved = useStore.getState().entries.find((e) => e.id === 'e1');
      expect(moved?.panel).toBe('free');
      expect(moved?.timelineGroupId).toBeUndefined();
      expect(moved?.eventTime).toBeUndefined();
      expect(moved?.eventTimeSortKey).toBeUndefined();
    });

    it('timeline → personal でも同様にクリアされる', async () => {
      const entry = makeEntry({
        id: 'e1',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '8:30',
        eventTimeSortKey: 510,
      });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'personal');

      const moved = useStore.getState().entries.find((e) => e.id === 'e1');
      expect(moved?.panel).toBe('personal');
      expect(moved?.timelineGroupId).toBeUndefined();
      expect(moved?.eventTime).toBeUndefined();
      expect(moved?.eventTimeSortKey).toBeUndefined();
    });

    it('free → personal の移動では groupId などその他のフィールドは保持される', async () => {
      const entry = makeEntry({
        id: 'e1',
        panel: 'free',
        groupId: 'mg-1',
        content: '元のテキスト',
      });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'personal');

      const moved = useStore.getState().entries.find((e) => e.id === 'e1');
      expect(moved?.panel).toBe('personal');
      // groupId / content など、タイムライン以外のフィールドは触らない
      expect(moved?.groupId).toBe('mg-1');
      expect(moved?.content).toBe('元のテキスト');
    });

    it('updatedAt が更新される', async () => {
      const entry = makeEntry({ id: 'e1', panel: 'free', updatedAt: 1000 });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'personal');

      const moved = useStore.getState().entries.find((e) => e.id === 'e1');
      expect(moved?.updatedAt).toBeGreaterThan(1000);
    });

    it('IDB に保存される値もタイムライン専用フィールドがクリアされている', async () => {
      const entry = makeEntry({
        id: 'e1',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '13:00',
        eventTimeSortKey: 780,
      });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'free');

      // putEntry に渡された entry もタイムライン関連が undefined のはず
      expect(mockPutEntry).toHaveBeenCalledTimes(1);
      const [savedEntry, sessionId] = mockPutEntry.mock.calls[0];
      expect(sessionId).toBe('session-test');
      expect(savedEntry.panel).toBe('free');
      expect(savedEntry.timelineGroupId).toBeUndefined();
      expect(savedEntry.eventTime).toBeUndefined();
      expect(savedEntry.eventTimeSortKey).toBeUndefined();
    });

    it('存在しない id を指定しても state は変化せず例外も発生しない', async () => {
      const entry = makeEntry({ id: 'e1', panel: 'free' });
      useStore.setState({ entries: [entry] });

      await useStore.getState().moveEntryToPanel('non-existent', 'timeline');

      expect(useStore.getState().entries).toEqual([entry]);
      expect(mockPutEntry).not.toHaveBeenCalled();
    });

    it('activeSessionId が null なら何もしない', async () => {
      const entry = makeEntry({
        id: 'e1',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
      });
      useStore.setState({ activeSessionId: null, entries: [entry] });

      await useStore.getState().moveEntryToPanel('e1', 'free');

      // セッションなしでは putEntry も呼ばれず、state も変化しない
      expect(mockPutEntry).not.toHaveBeenCalled();
      expect(useStore.getState().entries[0].panel).toBe('timeline');
    });
  });
});
