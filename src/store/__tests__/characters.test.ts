/**
 * characters スライスの本質的な振る舞いを検証する。
 *
 * 特に「キャラクター削除時、そのキャラを参照する相関図の関係も一緒に削除される」
 * というカスケード削除のドメインルールを保証することが目的。
 */

// removeCharacter はキャラ本体＋相関図＋推理メモ＋エントリの掃除を単一トランザクション
// （removeCharacterCascade）で行う。連動内訳はその引数 cascade で検証する。
const mockRemoveCharacterCascade = vi.fn().mockResolvedValue(undefined);
const mockPutCharacter = vi.fn().mockResolvedValue(undefined);
const mockBulkPutCharacters = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/idb', () => ({
  removeCharacterCascade: (...args: unknown[]) => mockRemoveCharacterCascade(...args),
  putCharacter: (...args: unknown[]) => mockPutCharacter(...args),
  bulkPutCharacters: (...args: unknown[]) => mockBulkPutCharacters(...args),
  getCharactersBySession: vi.fn().mockResolvedValue([]),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
}));

import { useStore } from '@/store/index';
import type { CharacterDeduction } from '@/types/memo';
import { makeCharacter, makeEntry, makeRelation } from './helpers';

/** removeCharacterCascade に渡された連動削除内訳（最後の呼び出し）を取り出す。 */
function lastCascade(): {
  characterId: string;
  relationIds: string[];
  deductionId?: string;
  entryUpdates: { id: string }[];
} {
  const calls = mockRemoveCharacterCascade.mock.calls;
  return calls[calls.length - 1][0];
}

function makeDeduction(overrides: Partial<CharacterDeduction> & { characterId: string }) {
  return {
    id: `ded-${overrides.characterId}`,
    sessionId: 'session-test',
    suspicionLevel: 0,
    memo: '',
    updatedAt: 0,
    ...overrides,
  } satisfies CharacterDeduction;
}

describe('charactersSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      activeSessionId: 'session-test',
      characters: [],
      relations: [],
      deductions: [],
      entries: [],
    });
  });

  describe('removeCharacter', () => {
    it('指定したキャラクターが state とストレージから削除される', async () => {
      const alice = makeCharacter({ id: 'alice', name: 'アリス' });
      const bob = makeCharacter({ id: 'bob', name: 'ボブ' });
      useStore.setState({ characters: [alice, bob] });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().characters.map((c) => c.id)).toEqual(['bob']);
      expect(lastCascade().characterId).toBe('alice');
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
      expect(lastCascade().relationIds).toEqual(['rel-1']);
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
      expect(lastCascade().relationIds).toEqual(['rel-2']);
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
      expect(lastCascade().relationIds.sort()).toEqual(['rel-ab', 'rel-ac']);
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
      expect(lastCascade().relationIds).toEqual([]);
    });

    // 孤児参照のクリーンアップ（推理メモ・エントリのキャラクタータグ）
    it('削除対象キャラの推理メモ（deduction）も削除される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      useStore.setState({
        characters: [alice],
        deductions: [makeDeduction({ characterId: 'alice', suspicionLevel: 3 })],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().deductions).toEqual([]);
      expect(lastCascade().deductionId).toBe('ded-alice');
    });

    it('他キャラの推理メモは残し、削除対象の deduction だけ消す', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bob = makeCharacter({ id: 'bob' });
      useStore.setState({
        characters: [alice, bob],
        deductions: [
          makeDeduction({ characterId: 'alice' }),
          makeDeduction({ characterId: 'bob' }),
        ],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().deductions.map((d) => d.characterId)).toEqual(['bob']);
    });

    it('エントリの characterTags から削除対象キャラ ID が除去される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const bob = makeCharacter({ id: 'bob' });
      const entry = makeEntry({ id: 'e1', characterTags: ['alice', 'bob'] });
      useStore.setState({
        characters: [alice, bob],
        entries: [entry],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().entries[0].characterTags).toEqual(['bob']);
      expect(lastCascade().entryUpdates.map((e) => e.id)).toEqual(['e1']);
    });

    it('characterTags に削除対象を含まないエントリは putEntry されない', async () => {
      const alice = makeCharacter({ id: 'alice' });
      const entry = makeEntry({ id: 'e1', characterTags: ['bob'] });
      useStore.setState({
        characters: [alice],
        entries: [entry],
      });

      await useStore.getState().removeCharacter('alice');

      expect(useStore.getState().entries[0].characterTags).toEqual(['bob']);
      expect(lastCascade().entryUpdates).toEqual([]);
    });

    it('削除キャラが全パネルのキャラクターフィルターから除去される', async () => {
      const alice = makeCharacter({ id: 'alice' });
      useStore.setState({
        characters: [alice],
        characterFilter: { free: ['alice'], personal: ['alice', 'bob'], timeline: [] },
      });

      await useStore.getState().removeCharacter('alice');

      const filter = useStore.getState().characterFilter;
      expect(filter.free).toEqual([]);
      expect(filter.personal).toEqual(['bob']);
      expect(filter.timeline).toEqual([]);
    });
  });
});
