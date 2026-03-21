import { renderHook } from '@testing-library/react';
import type { Character } from '@/types/memo';
import { useFilteredCharacters } from '../useFilteredCharacters';

// IndexedDB モック（ストアのインポート時に必要）
vi.mock('@/lib/idb', () => ({
  getImage: vi.fn(),
  putImage: vi.fn(),
  getAllSessions: vi.fn().mockResolvedValue([]),
  putSession: vi.fn(),
  deleteSession: vi.fn(),
  clearSessionData: vi.fn(),
  getAllByIndex: vi.fn().mockResolvedValue([]),
  put: vi.fn(),
}));

function makeChar(overrides: Partial<Character> & { id: string; name: string }): Character {
  return {
    role: 'pl',
    color: '#fff',
    sortOrder: 0,
    showInEntries: true,
    ...overrides,
  };
}

describe('useFilteredCharacters', () => {
  beforeEach(async () => {
    const { useStore } = await import('@/store');
    useStore.setState({ characters: [] });
  });

  it('PL と NPC を分離して返す', async () => {
    const { useStore } = await import('@/store');
    useStore.setState({
      characters: [
        makeChar({ id: '1', name: 'PL-A', role: 'pl', sortOrder: 1 }),
        makeChar({ id: '2', name: 'NPC-A', role: 'npc', sortOrder: 1 }),
        makeChar({ id: '3', name: 'PL-B', role: 'pl', sortOrder: 2 }),
      ],
    });

    const { result } = renderHook(() => useFilteredCharacters());
    expect(result.current.plChars.map((c) => c.name)).toEqual(['PL-A', 'PL-B']);
    expect(result.current.npcChars.map((c) => c.name)).toEqual(['NPC-A']);
  });

  it('sortOrder 順にソートされる', async () => {
    const { useStore } = await import('@/store');
    useStore.setState({
      characters: [
        makeChar({ id: '1', name: 'PL-B', role: 'pl', sortOrder: 3 }),
        makeChar({ id: '2', name: 'PL-A', role: 'pl', sortOrder: 1 }),
      ],
    });

    const { result } = renderHook(() => useFilteredCharacters());
    expect(result.current.plChars.map((c) => c.name)).toEqual(['PL-A', 'PL-B']);
  });

  it('空の場合は両方空配列', () => {
    const { result } = renderHook(() => useFilteredCharacters());
    expect(result.current.plChars).toEqual([]);
    expect(result.current.npcChars).toEqual([]);
  });
});
