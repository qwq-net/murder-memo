import type { Character } from '@/types/memo';
import { sortCharactersByRole, splitCharactersByRole } from '../characterSort';

// テスト用のキャラクター生成ヘルパー
function makeChar(overrides: Partial<Character> & { id: string; name: string }): Character {
  return {
    role: 'pl',
    color: '#fff',
    sortOrder: 0,
    showInEntries: true,
    ...overrides,
  };
}

describe('sortCharactersByRole', () => {
  it('PL を NPC より前にソートする', () => {
    const chars = [
      makeChar({ id: '1', name: 'NPC-A', role: 'npc', sortOrder: 0 }),
      makeChar({ id: '2', name: 'PL-A', role: 'pl', sortOrder: 0 }),
    ];
    const sorted = sortCharactersByRole(chars);
    expect(sorted[0].name).toBe('PL-A');
    expect(sorted[1].name).toBe('NPC-A');
  });

  it('同一ロール内は sortOrder 順', () => {
    const chars = [
      makeChar({ id: '1', name: 'PL-B', role: 'pl', sortOrder: 2 }),
      makeChar({ id: '2', name: 'PL-A', role: 'pl', sortOrder: 1 }),
      makeChar({ id: '3', name: 'NPC-B', role: 'npc', sortOrder: 2 }),
      makeChar({ id: '4', name: 'NPC-A', role: 'npc', sortOrder: 1 }),
    ];
    const sorted = sortCharactersByRole(chars);
    expect(sorted.map((c) => c.name)).toEqual(['PL-A', 'PL-B', 'NPC-A', 'NPC-B']);
  });

  it('空配列は空を返す', () => {
    expect(sortCharactersByRole([])).toEqual([]);
  });

  it('元の配列を変更しない', () => {
    const chars = [
      makeChar({ id: '1', name: 'NPC', role: 'npc', sortOrder: 0 }),
      makeChar({ id: '2', name: 'PL', role: 'pl', sortOrder: 0 }),
    ];
    sortCharactersByRole(chars);
    expect(chars[0].name).toBe('NPC');
  });
});

describe('splitCharactersByRole', () => {
  it('PL と NPC を分離する', () => {
    const chars = [
      makeChar({ id: '1', name: 'PL-A', role: 'pl', sortOrder: 1 }),
      makeChar({ id: '2', name: 'NPC-A', role: 'npc', sortOrder: 1 }),
      makeChar({ id: '3', name: 'PL-B', role: 'pl', sortOrder: 2 }),
    ];
    const { plChars, npcChars } = splitCharactersByRole(chars);
    expect(plChars.map((c) => c.name)).toEqual(['PL-A', 'PL-B']);
    expect(npcChars.map((c) => c.name)).toEqual(['NPC-A']);
  });

  it('各グループ内は sortOrder 順', () => {
    const chars = [
      makeChar({ id: '1', name: 'PL-B', role: 'pl', sortOrder: 3 }),
      makeChar({ id: '2', name: 'PL-A', role: 'pl', sortOrder: 1 }),
    ];
    const { plChars } = splitCharactersByRole(chars);
    expect(plChars.map((c) => c.name)).toEqual(['PL-A', 'PL-B']);
  });

  it('空配列は両方空', () => {
    const { plChars, npcChars } = splitCharactersByRole([]);
    expect(plChars).toEqual([]);
    expect(npcChars).toEqual([]);
  });
});
