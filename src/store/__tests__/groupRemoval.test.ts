/**
 * グループ削除時の振る舞いを保証する。
 *
 * 本質的な対比:
 *   - removeTimelineGroup: グループに紐付くエントリも一緒に削除（カスケード）
 *   - removeMemoGroup:     エントリは残し、groupId だけクリア（未分類化）
 *
 * この差はユーザーから見ても挙動が大きく異なるため、片方の修正で誤って
 * 揃えてしまうと「タイムラインのグループ削除でメモが消えた / 自由メモの
 * グループ削除でメモが消えた」という事故を招く。両方をペアでテストする。
 */

// グループ削除は単一トランザクションのヘルパーに委譲する:
//   - removeTimelineGroup → deleteTimelineGroupCascade(groupId, entryIds)
//   - removeMemoGroup     → reassignMemoGroupAndDelete(groupId, reassignedEntries, sid)
// 画像 blob は削除時にハード削除せず GC（cleanupOrphanImages）に委ねるため、
// グループ削除経路では deleteImage を一切呼ばない（Undo 復活のため）。
const mockPutEntry = vi.fn().mockResolvedValue(undefined);
const mockDeleteImage = vi.fn().mockResolvedValue(undefined);
const mockDeleteTimelineGroupCascade = vi.fn().mockResolvedValue(undefined);
const mockReassignMemoGroupAndDelete = vi.fn().mockResolvedValue(undefined);
const mockPutTimelineGroup = vi.fn().mockResolvedValue(undefined);
const mockPutMemoGroup = vi.fn().mockResolvedValue(undefined);
const mockBulkPutTimelineGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutMemoGroups = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  putEntry: (...args: unknown[]) => mockPutEntry(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
  deleteTimelineGroupCascade: (...args: unknown[]) => mockDeleteTimelineGroupCascade(...args),
  reassignMemoGroupAndDelete: (...args: unknown[]) => mockReassignMemoGroupAndDelete(...args),
  putTimelineGroup: (...args: unknown[]) => mockPutTimelineGroup(...args),
  putMemoGroup: (...args: unknown[]) => mockPutMemoGroup(...args),
  bulkPutTimelineGroups: (...args: unknown[]) => mockBulkPutTimelineGroups(...args),
  bulkPutMemoGroups: (...args: unknown[]) => mockBulkPutMemoGroups(...args),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
  getTimelineGroupsBySession: vi.fn().mockResolvedValue([]),
  getMemoGroupsBySession: vi.fn().mockResolvedValue([]),
  // セッション切替（store/index.ts の activeSessionId subscribe）が呼ぶ残りのローダー群。
  // 競合ロールバックのテストで実際に切替を発火させるため揃えておく
  getCharactersBySession: vi.fn().mockResolvedValue([]),
  getDeductionsBySession: vi.fn().mockResolvedValue([]),
  getRelationsBySession: vi.fn().mockResolvedValue([]),
  getLinkKeywordsBySession: vi.fn().mockResolvedValue([]),
}));

import { useStore } from '@/store/index';
import { makeEntry, makeMemoGroup, makeTimelineGroup } from './helpers';

describe('グループ削除のドメインルール', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      activeSessionId: 'session-test',
      entries: [],
      timelineGroups: [],
      memoGroups: [],
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('removeTimelineGroup (カスケード削除)', () => {
    it('グループに紐付くエントリも一緒に削除される', async () => {
      const tg = makeTimelineGroup({ id: 'tg-1' });
      const insideA = makeEntry({
        id: 'e-in-a',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
      });
      const insideB = makeEntry({
        id: 'e-in-b',
        panel: 'timeline',
        timelineGroupId: 'tg-1',
      });
      const other = makeEntry({
        id: 'e-other',
        panel: 'timeline',
        timelineGroupId: 'tg-2',
      });
      useStore.setState({
        timelineGroups: [tg],
        entries: [insideA, insideB, other],
      });

      await useStore.getState().removeTimelineGroup('tg-1');

      // グループ削除（所属エントリ ID と共に単一トランザクションのカスケードへ委譲）
      expect(useStore.getState().timelineGroups).toEqual([]);
      const [groupId, entryIds] = mockDeleteTimelineGroupCascade.mock.calls[0];
      expect(groupId).toBe('tg-1');
      expect([...entryIds].sort()).toEqual(['e-in-a', 'e-in-b']);

      // 所属エントリも削除されている（他グループのエントリは残る）
      expect(useStore.getState().entries.map((e) => e.id)).toEqual(['e-other']);
    });

    // 回帰防止: グループ削除では画像 blob をハード削除しない（Undo で復活しうるため）。
    // 孤児 blob は安全な時点で cleanupOrphanImages がまとめて回収する。
    it('画像エントリを含む場合でも IDB の画像 blob はハード削除しない（GC に委ねる）', async () => {
      const tg = makeTimelineGroup({ id: 'tg-1' });
      const imageEntry = makeEntry({
        id: 'e-img',
        panel: 'timeline',
        type: 'image',
        timelineGroupId: 'tg-1',
        imageBlobKey: 'blob-key-1',
      });
      useStore.setState({
        timelineGroups: [tg],
        entries: [imageEntry],
      });

      await useStore.getState().removeTimelineGroup('tg-1');

      // blob は即時削除されない（GC 方式）
      expect(mockDeleteImage).not.toHaveBeenCalled();
      // エントリ自体はカスケード対象として削除される
      const [, entryIds] = mockDeleteTimelineGroupCascade.mock.calls[0];
      expect(entryIds).toEqual(['e-img']);
      expect(useStore.getState().entries).toEqual([]);
    });

    it('所属エントリが無いグループでも安全に削除できる', async () => {
      const tg = makeTimelineGroup({ id: 'tg-empty' });
      useStore.setState({ timelineGroups: [tg], entries: [] });

      await useStore.getState().removeTimelineGroup('tg-empty');

      expect(useStore.getState().timelineGroups).toEqual([]);
      const [groupId, entryIds] = mockDeleteTimelineGroupCascade.mock.calls[0];
      expect(groupId).toBe('tg-empty');
      expect(entryIds).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('removeMemoGroup (エントリは保持、groupId クリア)', () => {
    it('グループは削除されるが、所属エントリは groupId をクリアして残る', async () => {
      const mg = makeMemoGroup({ id: 'mg-1', panel: 'free' });
      const insideA = makeEntry({ id: 'e-in-a', panel: 'free', groupId: 'mg-1' });
      const insideB = makeEntry({ id: 'e-in-b', panel: 'free', groupId: 'mg-1' });
      const other = makeEntry({ id: 'e-other', panel: 'free', groupId: 'mg-2' });
      useStore.setState({
        memoGroups: [mg],
        entries: [insideA, insideB, other],
      });

      await useStore.getState().removeMemoGroup('mg-1');

      // グループは削除（未分類化エントリと共に単一トランザクションのヘルパーへ委譲）
      expect(useStore.getState().memoGroups).toEqual([]);
      const [groupId, reassigned] = mockReassignMemoGroupAndDelete.mock.calls[0];
      expect(groupId).toBe('mg-1');
      expect(reassigned.map((e: { id: string }) => e.id).sort()).toEqual(['e-in-a', 'e-in-b']);
      expect(reassigned.every((e: { groupId?: string }) => e.groupId === undefined)).toBe(true);

      // エントリは消えず、groupId だけクリア
      const entries = useStore.getState().entries;
      expect(entries.map((e) => e.id).sort()).toEqual(['e-in-a', 'e-in-b', 'e-other']);
      expect(entries.find((e) => e.id === 'e-in-a')?.groupId).toBeUndefined();
      expect(entries.find((e) => e.id === 'e-in-b')?.groupId).toBeUndefined();
      // 他グループ所属のエントリは groupId が保持される
      expect(entries.find((e) => e.id === 'e-other')?.groupId).toBe('mg-2');
    });

    it('画像エントリを含むグループでも、エントリは削除されないため deleteImage は呼ばれない', async () => {
      const mg = makeMemoGroup({ id: 'mg-1', panel: 'free' });
      const imageEntry = makeEntry({
        id: 'e-img',
        panel: 'free',
        type: 'image',
        groupId: 'mg-1',
        imageBlobKey: 'blob-key-1',
      });
      useStore.setState({
        memoGroups: [mg],
        entries: [imageEntry],
      });

      await useStore.getState().removeMemoGroup('mg-1');

      // メモグループ削除はエントリ自体は残すので、画像も削除されない
      expect(mockDeleteImage).not.toHaveBeenCalled();
      // エントリは groupId クリアされた状態で残る
      const e = useStore.getState().entries.find((e) => e.id === 'e-img');
      expect(e).toBeDefined();
      expect(e?.imageBlobKey).toBe('blob-key-1');
      expect(e?.groupId).toBeUndefined();
    });

    it('所属エントリが無いグループでも安全に削除できる', async () => {
      const mg = makeMemoGroup({ id: 'mg-empty', panel: 'personal' });
      useStore.setState({ memoGroups: [mg], entries: [] });

      await useStore.getState().removeMemoGroup('mg-empty');

      expect(useStore.getState().memoGroups).toEqual([]);
      const [groupId, reassigned] = mockReassignMemoGroupAndDelete.mock.calls[0];
      expect(groupId).toBe('mg-empty');
      expect(reassigned).toEqual([]);
    });

    it('activeSessionId が null なら早期 return で何もしない', async () => {
      const mg = makeMemoGroup({ id: 'mg-1', panel: 'free' });
      const entry = makeEntry({ id: 'e1', panel: 'free', groupId: 'mg-1' });
      useStore.setState({
        activeSessionId: null,
        memoGroups: [mg],
        entries: [entry],
      });

      await useStore.getState().removeMemoGroup('mg-1');

      // セッションなしでは何も起きない
      expect(mockReassignMemoGroupAndDelete).not.toHaveBeenCalled();
      expect(useStore.getState().memoGroups).toEqual([mg]);
      expect(useStore.getState().entries[0].groupId).toBe('mg-1');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  /**
   * IDB 書き込み失敗時のロールバックと、await 中にセッション切替が完了した場合の
   * 巻き戻し放棄（captureSessionRollback。src/lib/optimisticRollback.ts 参照）を保証する。
   */
  describe('カスケード削除のロールバック（セッション切替との競合安全）', () => {
    afterEach(async () => {
      // 切替テスト後は session-test に戻し、リロード完了を待ってから次のテストへ
      // （待たないと非同期の loadEntries([]) が後続テストの state を上書きしてフレークする）。
      // 切替していないテストでは subscribe が発火せず isSessionReady が立たないため何もしない
      if (useStore.getState().activeSessionId !== 'session-test') {
        useStore.setState({ activeSessionId: 'session-test' });
        await vi.waitFor(() => expect(useStore.getState().isSessionReady).toBe(true));
      }
    });

    it('removeTimelineGroup: 失敗したら削除前へ参照ごと巻き戻す', async () => {
      const prevEntries = [makeEntry({ id: 'e1', panel: 'timeline', timelineGroupId: 'tg-1' })];
      const prevGroups = [makeTimelineGroup({ id: 'tg-1' })];
      useStore.setState({ entries: prevEntries, timelineGroups: prevGroups });
      mockDeleteTimelineGroupCascade.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().removeTimelineGroup('tg-1');

      expect(useStore.getState().entries).toBe(prevEntries);
      expect(useStore.getState().timelineGroups).toBe(prevGroups);
    });

    it('removeMemoGroup: 失敗したら未分類化前へ参照ごと巻き戻す', async () => {
      const prevEntries = [makeEntry({ id: 'e1', panel: 'free', groupId: 'mg-1' })];
      const prevGroups = [makeMemoGroup({ id: 'mg-1', panel: 'free' })];
      useStore.setState({ entries: prevEntries, memoGroups: prevGroups });
      mockReassignMemoGroupAndDelete.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().removeMemoGroup('mg-1');

      expect(useStore.getState().entries).toBe(prevEntries);
      expect(useStore.getState().memoGroups).toBe(prevGroups);
    });

    it('removeTimelineGroup: 失敗の確定がセッション切替後なら巻き戻さない', async () => {
      useStore.setState({
        entries: [makeEntry({ id: 'e1', panel: 'timeline', timelineGroupId: 'tg-1' })],
        timelineGroups: [makeTimelineGroup({ id: 'tg-1' })],
      });
      let reject!: (e: Error) => void;
      mockDeleteTimelineGroupCascade.mockImplementationOnce(
        () =>
          new Promise((_, rej) => {
            reject = rej;
          }),
      );

      const pending = useStore.getState().removeTimelineGroup('tg-1');

      // await 中にセッション切替が完了する（subscribe のリロードが新セッションのデータを投入）
      useStore.setState({ activeSessionId: 'session-2' });
      await vi.waitFor(() => expect(useStore.getState().isSessionReady).toBe(true));
      const loadedEntries = useStore.getState().entries;
      const loadedGroups = useStore.getState().timelineGroups;

      reject(new Error('IDB error'));
      await pending;

      // 旧セッションのスナップショットで上書きされない
      expect(useStore.getState().entries).toBe(loadedEntries);
      expect(useStore.getState().timelineGroups).toBe(loadedGroups);
    });
  });
});
