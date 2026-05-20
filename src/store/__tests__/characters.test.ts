/**
 * characters スライスの本質的な振る舞いを検証する。
 *
 * 特に「キャラクター削除時、そのキャラを参照する相関図の関係も一緒に削除される」
 * というカスケード削除のドメインルールを保証することが目的。
 */

const mockDeleteCharacter = vi.fn().mockResolvedValue(undefined);
const mockDeleteRelation = vi.fn().mockResolvedValue(undefined);
const mockPutCharacter = vi.fn().mockResolvedValue(undefined);
const mockBulkPutCharacters = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  deleteCharacter: (...args: unknown[]) => mockDeleteCharacter(...args),
  deleteRelation: (...args: unknown[]) => mockDeleteRelation(...args),
  putCharacter: (...args: unknown[]) => mockPutCharacter(...args),
  bulkPutCharacters: (...args: unknown[]) => mockBulkPutCharacters(...args),
  getCharactersBySession: vi.fn().mockResolvedValue([]),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
}));

import { useStore } from '@/store/index';
import { makeCharacter, makeRelation } from './helpers';

describe('charactersSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      activeSessionId: 'session-test',
      characters: [],
      relations: [],
    });
  });

  describe('removeCharacter', () => {
    it('指定したキャラクターが state とストレージから削除される', async () => {
      const alice = makeCharacter({ id: 'alice', name: 'アリス' });
      const bob = makeCharacter({ id: 'bob', name: 'ボブ' });
      useStore.setState({ characters: [alice, bob] });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().characters.map((c) => c.id)).toEqual(['bob']);
      expect(mockDeleteCharacter).toHaveBeenCalledWith('alice');
    });

    it('削除対象キャラを fromCharacterId に持つ関係が削除される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bob = makeCharacter({ id: 'bob' });
      const rel = makeRelation({
        id: 'rel-1',
        fromCharacterId: 'alice',
        toCharacterId: 'bob',
      });
      useStore.setState({
        characters: [alice, bob],
        relations: [rel],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().relations).toEqual([]);
      expect(mockDeleteRelation).toHaveBeenCalledWith('rel-1');
    });

    it('削除対象キャラを toCharacterId に持つ関係が削除される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bob = makeCharacter({ id: 'bob' });
      const rel = makeRelation({
        id: 'rel-2',
        fromCharacterId: 'bob',
        toCharacterId: 'alice',
      });
      useStore.setState({
        characters: [alice, bob],
        relations: [rel],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().relations).toEqual([]);
      expect(mockDeleteRelation).toHaveBeenCalledWith('rel-2');
    });

    it('複数の関係を持つキャラ削除時、関係する側だけが削除され他は保持される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bob = makeCharacter({ id: 'bob' });
      const carol = makeCharacter({ id: 'carol' });
      // alice ⇔ bob と alice → carol を持つ。bob ⇔ carol は alice 削除に影響しない
      const relAliceBob = makeRelation({
        id: 'rel-ab',
        fromCharacterId: 'alice',
        toCharacterId: 'bob',
      });
      const relAliceCarol = makeRelation({
        id: 'rel-ac',
        fromCharacterId: 'alice',
        toCharacterId: 'carol',
      });
      const relBobCarol = makeRelation({
        id: 'rel-bc',
        fromCharacterId: 'bob',
        toCharacterId: 'carol',
      });
      useStore.setState({
        characters: [alice, bob, carol],
        relations: [relAliceBob, relAliceCarol, relBobCarol],
      });

      await useStore.getState().removeCharacter('alice');

      // alice 絡みの 2 本だけ削除、bob ⇔ carol は残る
      expect(useStore.getState().relations.map((r) => r.id)).toEqual(['rel-bc']);
      expect(mockDeleteRelation).toHaveBeenCalledWith('rel-ab');
      expect(mockDeleteRelation).toHaveBeenCalledWith('rel-ac');
      expect(mockDeleteRelation).not.toHaveBeenCalledWith('rel-bc');
    });

    it('関係が一つも無いキャラを削除しても relations は変化しない', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bobCarolRel = makeRelation({
        id: 'rel-bc',
        fromCharacterId: 'bob',
        toCharacterId: 'carol',
      });
      useStore.setState({
        characters: [alice],
        relations: [bobCarolRel],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().relations).toEqual([bobCarolRel]);
      expect(mockDeleteRelation).not.toHaveBeenCalled();
    });
  });
});
