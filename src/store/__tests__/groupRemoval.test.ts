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

const mockPutEntry = vi.fn().mockResolvedValue(undefined);
const mockDeleteEntry = vi.fn().mockResolvedValue(undefined);
const mockDeleteImage = vi.fn().mockResolvedValue(undefined);
const mockDeleteTimelineGroup = vi.fn().mockResolvedValue(undefined);
const mockDeleteMemoGroup = vi.fn().mockResolvedValue(undefined);
const mockPutTimelineGroup = vi.fn().mockResolvedValue(undefined);
const mockPutMemoGroup = vi.fn().mockResolvedValue(undefined);
const mockBulkPutTimelineGroups = vi.fn().mockResolvedValue(undefined);
const mockBulkPutMemoGroups = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  putEntry: (...args: unknown[]) => mockPutEntry(...args),
  deleteEntry: (...args: unknown[]) => mockDeleteEntry(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
  deleteTimelineGroup: (...args: unknown[]) => mockDeleteTimelineGroup(...args),
  deleteMemoGroup: (...args: unknown[]) => mockDeleteMemoGroup(...args),
  putTimelineGroup: (...args: unknown[]) => mockPutTimelineGroup(...args),
  putMemoGroup: (...args: unknown[]) => mockPutMemoGroup(...args),
  bulkPutTimelineGroups: (...args: unknown[]) => mockBulkPutTimelineGroups(...args),
  bulkPutMemoGroups: (...args: unknown[]) => mockBulkPutMemoGroups(...args),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
  getTimelineGroupsBySession: vi.fn().mockResolvedValue([]),
  getMemoGroupsBySession: vi.fn().mockResolvedValue([]),
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

      // グループ削除
      expect(useStore.getState().timelineGroups).toEqual([]);
      expect(mockDeleteTimelineGroup).toHaveBeenCalledWith('tg-1');

      // 所属エントリも削除されている（他グループのエントリは残る）
      expect(useStore.getState().entries.map((e) => e.id)).toEqual(['e-other']);
      expect(mockDeleteEntry).toHaveBeenCalledWith('e-in-a');
      expect(mockDeleteEntry).toHaveBeenCalledWith('e-in-b');
      expect(mockDeleteEntry).not.toHaveBeenCalledWith('e-other');
    });

    it('画像エントリを含む場合、IDB の画像 blob も削除される', async () => {
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

      // deleteEntry 経由で deleteImage('blob-key-1') が呼ばれる
      expect(mockDeleteImage).toHaveBeenCalledWith('blob-key-1');
    });

    it('所属エントリが無いグループでも安全に削除できる', async () => {
      const tg = makeTimelineGroup({ id: 'tg-empty' });
      useStore.setState({ timelineGroups: [tg], entries: [] });

      await useStore.getState().removeTimelineGroup('tg-empty');

      expect(useStore.getState().timelineGroups).toEqual([]);
      expect(mockDeleteTimelineGroup).toHaveBeenCalledWith('tg-empty');
      expect(mockDeleteEntry).not.toHaveBeenCalled();
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

      // グループは削除
      expect(useStore.getState().memoGroups).toEqual([]);
      expect(mockDeleteMemoGroup).toHaveBeenCalledWith('mg-1');

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
      expect(mockDeleteMemoGroup).toHaveBeenCalledWith('mg-empty');
      expect(mockPutEntry).not.toHaveBeenCalled();
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
      expect(mockDeleteMemoGroup).not.toHaveBeenCalled();
      expect(useStore.getState().memoGroups).toEqual([mg]);
      expect(useStore.getState().entries[0].groupId).toBe('mg-1');
    });
  });
});
