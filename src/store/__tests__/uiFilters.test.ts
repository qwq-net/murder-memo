/**
 * ui スライスの絞り込み（重要度フィルタ）と revealEntry の検証。
 *
 * - 重要度フィルタの toggle / clear / clearAll の基本動作
 * - revealEntry が「対象を隠しているフィルターだけ」を解除し、干渉しないフィルターは
 *   温存する（過剰解除しない）こと。検索結果クリックの遷移可能性を担保する核心ロジック。
 */
vi.mock('@/lib/idb', () => ({
  putTimelineGroup: vi.fn().mockResolvedValue(undefined),
  putMemoGroup: vi.fn().mockResolvedValue(undefined),
  putEntry: vi.fn().mockResolvedValue(undefined),
  getEntriesBySession: vi.fn().mockResolvedValue([]),
  getCharactersBySession: vi.fn().mockResolvedValue([]),
}));

import { useStore } from '@/store/index';
import type { ImportanceLevel, PanelId } from '@/types/memo';
import { makeCharacter, makeEntry } from './helpers';

const EMPTY: Record<PanelId, ImportanceLevel[]> = { free: [], personal: [], timeline: [] };
const EMPTY_CHAR: Record<PanelId, string[]> = { free: [], personal: [], timeline: [] };

beforeEach(() => {
  useStore.setState({
    entries: [],
    characters: [],
    timelineGroups: [],
    memoGroups: [],
    uncategorizedCollapsed: {},
    characterFilter: { ...EMPTY_CHAR },
    importanceFilter: { ...EMPTY },
  });
});

describe('重要度フィルタのアクション', () => {
  it('toggleImportanceFilter で追加・解除できる', () => {
    useStore.getState().toggleImportanceFilter('free', 'high');
    expect(useStore.getState().importanceFilter.free).toEqual(['high']);
    useStore.getState().toggleImportanceFilter('free', 'high');
    expect(useStore.getState().importanceFilter.free).toEqual([]);
  });

  it('clearImportanceFilter は対象パネルのみ消す', () => {
    useStore.setState({ importanceFilter: { free: ['high'], personal: ['low'], timeline: [] } });
    useStore.getState().clearImportanceFilter('free');
    expect(useStore.getState().importanceFilter).toEqual({
      free: [],
      personal: ['low'],
      timeline: [],
    });
  });

  it('clearAllImportanceFilters は全パネルを消す（セッション切替/クリアの回帰防止）', () => {
    useStore.setState({
      importanceFilter: { free: ['high'], personal: ['low'], timeline: ['medium'] },
    });
    useStore.getState().clearAllImportanceFilters();
    expect(useStore.getState().importanceFilter).toEqual(EMPTY);
  });
});

describe('revealEntry: 干渉するフィルターだけ解除する', () => {
  const charA = makeCharacter({ id: 'a', name: '田中' });
  const charZ = makeCharacter({ id: 'z', name: '佐藤' });

  it('両フィルターとも対象を表示している場合は何も解除しない（過剰解除しない）', () => {
    const entry = makeEntry({
      id: '1',
      panel: 'free',
      content: '何か',
      characterTags: ['a'],
      importance: 'high',
    });
    useStore.setState({
      entries: [entry],
      characters: [charA],
      characterFilter: { ...EMPTY_CHAR, free: ['a'] },
      importanceFilter: { ...EMPTY, free: ['high'] },
    });
    useStore.getState().revealEntry(entry);
    expect(useStore.getState().characterFilter.free).toEqual(['a']);
    expect(useStore.getState().importanceFilter.free).toEqual(['high']);
  });

  it('重要度フィルターが対象を隠している場合、重要度のみ解除しキャラは温存', () => {
    const entry = makeEntry({
      id: '1',
      panel: 'free',
      content: '何か',
      characterTags: ['a'],
      importance: 'high',
    });
    useStore.setState({
      entries: [entry],
      characters: [charA],
      characterFilter: { ...EMPTY_CHAR, free: ['a'] },
      importanceFilter: { ...EMPTY, free: ['low'] }, // high を隠す
    });
    useStore.getState().revealEntry(entry);
    expect(useStore.getState().importanceFilter.free).toEqual([]);
    expect(useStore.getState().characterFilter.free).toEqual(['a']); // 温存
  });

  it('キャラフィルターが対象を隠している場合、キャラのみ解除し重要度は温存', () => {
    const entry = makeEntry({
      id: '1',
      panel: 'free',
      content: '何か',
      characterTags: ['a'],
      importance: 'high',
    });
    useStore.setState({
      entries: [entry],
      characters: [charA, charZ],
      characterFilter: { ...EMPTY_CHAR, free: ['z'] }, // 佐藤は本文にもタグにも無い → 隠す
      importanceFilter: { ...EMPTY, free: ['high'] },
    });
    useStore.getState().revealEntry(entry);
    expect(useStore.getState().characterFilter.free).toEqual([]);
    expect(useStore.getState().importanceFilter.free).toEqual(['high']); // 温存
  });

  it('別パネルのフィルターには触れない', () => {
    const entry = makeEntry({ id: '1', panel: 'free', content: '何か', importance: 'high' });
    useStore.setState({
      entries: [entry],
      characterFilter: { ...EMPTY_CHAR, personal: ['a'] },
      importanceFilter: { ...EMPTY, free: ['low'] }, // free の high を隠す
    });
    useStore.getState().revealEntry(entry);
    expect(useStore.getState().importanceFilter.free).toEqual([]);
    expect(useStore.getState().characterFilter.personal).toEqual(['a']); // 別パネルは不変
  });
});
