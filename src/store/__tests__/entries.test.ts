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

  describe('updateEntry の楽観更新ロールバック', () => {
    it('成功時は更新が反映される', async () => {
      useStore.setState({ entries: [makeEntry({ id: 'e1', content: '元の内容' })] });

      await useStore.getState().updateEntry('e1', { content: '新しい内容' });

      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.content).toBe('新しい内容');
    });

    it('putEntry が失敗したら内容を元に戻す', async () => {
      useStore.setState({ entries: [makeEntry({ id: 'e1', content: '元の内容' })] });
      mockPutEntry.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().updateEntry('e1', { content: '新しい内容' });

      // ロールバックで元の内容に戻る
      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.content).toBe('元の内容');
    });
  });

  describe('reorderEntries の楽観更新ロールバック', () => {
    it('成功時は orderedIds 順に sortOrder が再採番される', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'e1', panel: 'free', sortOrder: 0 }),
          makeEntry({ id: 'e2', panel: 'free', sortOrder: 1 }),
        ],
      });

      await useStore.getState().reorderEntries('free', ['e2', 'e1']);

      expect(useStore.getState().entries.find((e) => e.id === 'e2')?.sortOrder).toBe(0);
      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.sortOrder).toBe(1);
    });

    it('bulkPutEntries が失敗したら並び順を元に戻す', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'e1', panel: 'free', sortOrder: 0 }),
          makeEntry({ id: 'e2', panel: 'free', sortOrder: 1 }),
        ],
      });
      mockBulkPutEntries.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().reorderEntries('free', ['e2', 'e1']);

      // ロールバックで元の sortOrder に戻る
      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.sortOrder).toBe(0);
      expect(useStore.getState().entries.find((e) => e.id === 'e2')?.sortOrder).toBe(1);
    });
  });

  describe('addEntry の保存失敗ロールバック', () => {
    it('成功時は末尾に追加され entry を返す', async () => {
      useStore.setState({ entries: [] });
      const created = await useStore.getState().addEntry({ panel: 'free', content: 'x' });
      expect(useStore.getState().entries.map((e) => e.id)).toEqual([created.id]);
    });

    // 回帰防止: CLAUDE.md の楽観更新ロールバック契約に addEntry を整合させる
    it('putEntry が失敗したら追加分を除去し throw する', async () => {
      useStore.setState({ entries: [] });
      mockPutEntry.mockRejectedValueOnce(new Error('IDB error'));

      await expect(useStore.getState().addEntry({ panel: 'free', content: 'x' })).rejects.toThrow();
      // ロールバックで追加分が残らない
      expect(useStore.getState().entries).toEqual([]);
    });
  });

  describe('deleteEntry の画像 blob 非ハード削除（GC 方式）', () => {
    // 回帰防止: 削除時に blob を即削除すると Undo 復活で画像が壊れる/複製で共有 blob を巻き添えにする。
    // blob は GC（cleanupOrphanImages）で回収するため deleteEntry では消さない。
    it('画像エントリを削除しても deleteImage は呼ばれない', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'e1', type: 'image', imageBlobKey: 'blob-1' })],
      });

      await useStore.getState().deleteEntry('e1');

      expect(mockDeleteImage).not.toHaveBeenCalled();
      expect(mockDeleteEntry).toHaveBeenCalledWith('e1');
      expect(useStore.getState().entries).toEqual([]);
    });
  });

  describe('moveEntryToPanel の原子化（panel + group を 1 回で確定）', () => {
    it('free → timeline で type/timelineGroupId を設定し groupId をクリア（1 回の put）', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'e1', panel: 'free', type: 'text', groupId: 'mg-1' })],
      });

      await useStore.getState().moveEntryToPanel('e1', 'timeline', { timelineGroupId: 'tg-1' });

      const moved = useStore.getState().entries.find((e) => e.id === 'e1');
      expect(moved?.panel).toBe('timeline');
      expect(moved?.type).toBe('timeline');
      expect(moved?.timelineGroupId).toBe('tg-1');
      // メモグループ参照はタイムラインで無効なのでクリアされる
      expect(moved?.groupId).toBeUndefined();
      // 2 段階ではなく 1 回の put で原子的に確定する（不可視孤児を作らない）
      expect(mockPutEntry).toHaveBeenCalledTimes(1);
    });

    it('opts.groupId 未指定なら非タイムライン移動で groupId を保持する', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'e1', panel: 'free', groupId: 'mg-1' })],
      });

      await useStore.getState().moveEntryToPanel('e1', 'personal');

      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.groupId).toBe('mg-1');
    });

    it('putEntry が失敗したら移動前へロールバックする', async () => {
      useStore.setState({ entries: [makeEntry({ id: 'e1', panel: 'free' })] });
      mockPutEntry.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().moveEntryToPanel('e1', 'personal');

      expect(useStore.getState().entries.find((e) => e.id === 'e1')?.panel).toBe('free');
    });

    it('別パネルへ移動すると移動先パネルの末尾（最大 sortOrder + 1）に配置される', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'p1', panel: 'personal', sortOrder: 0 }),
          makeEntry({ id: 'p2', panel: 'personal', sortOrder: 1 }),
          makeEntry({ id: 'f1', panel: 'free', sortOrder: 5 }),
        ],
      });

      await useStore.getState().moveEntryToPanel('f1', 'personal');

      // personal の最大 sortOrder(1) + 1 = 2 で末尾に付く
      expect(useStore.getState().entries.find((e) => e.id === 'f1')?.sortOrder).toBe(2);
    });
  });

  describe('setEntryGroup（同一パネル内グループ変更）', () => {
    it('groupId を変更し、移動先で末尾になるよう sortOrder を再採番する', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 }),
          makeEntry({ id: 'b', panel: 'free', groupId: 'g2', sortOrder: 3 }),
          makeEntry({ id: 'c', panel: 'free', groupId: undefined, sortOrder: 1 }),
        ],
      });

      await useStore.getState().setEntryGroup('c', 'g1');

      const moved = useStore.getState().entries.find((e) => e.id === 'c');
      expect(moved?.groupId).toBe('g1');
      // パネル内最大 sortOrder(3) + 1 = 4 で末尾配置
      expect(moved?.sortOrder).toBe(4);
    });

    it('同じ groupId への変更は no-op（put されない）', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 })],
      });

      await useStore.getState().setEntryGroup('a', 'g1');

      expect(mockPutEntry).not.toHaveBeenCalled();
    });

    it('putEntry が失敗したらロールバックする', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 })],
      });
      mockPutEntry.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().setEntryGroup('a', 'g2');

      expect(useStore.getState().entries.find((e) => e.id === 'a')?.groupId).toBe('g1');
    });
  });

  describe('moveEntryAcrossContainers（コンテナ跨ぎ DnD の原子確定）', () => {
    it('メモグループ間移動: groupId 変更 + orderedIds で sortOrder を再採番', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 }),
          makeEntry({ id: 'b', panel: 'free', groupId: 'g2', sortOrder: 1 }),
        ],
      });

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'free',
        groupId: 'g2',
        orderedIds: ['b', 'a'],
      });

      const a = useStore.getState().entries.find((e) => e.id === 'a');
      expect(a?.groupId).toBe('g2');
      expect(a?.sortOrder).toBe(1);
      expect(useStore.getState().entries.find((e) => e.id === 'b')?.sortOrder).toBe(0);
    });

    it('メモ → タイムライン移動: type/timelineGroupId/時刻を設定し groupId をクリア', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'a', panel: 'free', type: 'text', groupId: 'g1' })],
      });

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
        eventTime: '13:00',
        eventTimeSortKey: 780,
        orderedIds: ['a'],
      });

      const a = useStore.getState().entries.find((e) => e.id === 'a');
      expect(a?.panel).toBe('timeline');
      expect(a?.type).toBe('timeline');
      expect(a?.timelineGroupId).toBe('tg-1');
      expect(a?.eventTime).toBe('13:00');
      expect(a?.eventTimeSortKey).toBe(780);
      expect(a?.groupId).toBeUndefined();
    });

    it('タイムライン → メモ移動: timeline 系フィールドを完全クリア', async () => {
      useStore.setState({
        entries: [
          makeEntry({
            id: 'a',
            panel: 'timeline',
            type: 'timeline',
            timelineGroupId: 'tg-1',
            eventTime: '13:00',
            eventTimeSortKey: 780,
          }),
        ],
      });

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'personal',
        groupId: undefined,
        orderedIds: ['a'],
      });

      const a = useStore.getState().entries.find((e) => e.id === 'a');
      expect(a?.panel).toBe('personal');
      expect(a?.timelineGroupId).toBeUndefined();
      expect(a?.eventTime).toBeUndefined();
      expect(a?.eventTimeSortKey).toBeUndefined();
      // timeline を離れたら type も timeline を残さない（カードの左バー位置のズレ防止）
      expect(a?.type).toBe('text');
    });

    it('実質変化が無ければ put されない（no-op で Undo を汚さない）', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 })],
      });

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'free',
        groupId: 'g1',
        orderedIds: ['a'],
      });

      expect(mockBulkPutEntries).not.toHaveBeenCalled();
    });

    it('bulkPutEntries が失敗したら移動前へロールバックする', async () => {
      useStore.setState({
        entries: [
          makeEntry({ id: 'a', panel: 'free', groupId: 'g1', sortOrder: 0 }),
          makeEntry({ id: 'b', panel: 'free', groupId: 'g2', sortOrder: 1 }),
        ],
      });
      mockBulkPutEntries.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'free',
        groupId: 'g2',
        orderedIds: ['b', 'a'],
      });

      const a = useStore.getState().entries.find((e) => e.id === 'a');
      expect(a?.groupId).toBe('g1');
      expect(a?.sortOrder).toBe(0);
    });

    it('activeSessionId が null なら何もしない', async () => {
      useStore.setState({
        activeSessionId: null,
        entries: [makeEntry({ id: 'a', panel: 'free', groupId: 'g1' })],
      });

      await useStore.getState().moveEntryAcrossContainers({
        id: 'a',
        panel: 'free',
        groupId: 'g2',
        orderedIds: ['a'],
      });

      expect(mockBulkPutEntries).not.toHaveBeenCalled();
      expect(useStore.getState().entries.find((e) => e.id === 'a')?.groupId).toBe('g1');
    });
  });
});
