import type {
  Character,
  CharacterRelation,
  MemoEntry,
  MemoGroup,
  TimelineGroup,
} from '@/types/memo';

/** テスト用ストアの初期状態を組み立てるためのデータファクトリ群 */

export function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: overrides.id ?? `char-${Math.random().toString(36).slice(2, 8)}`,
    name: 'テストキャラ',
    color: '#000000',
    sortOrder: 0,
    role: 'pl',
    showInEntries: true,
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<MemoEntry> = {}): MemoEntry {
  const now = Date.now();
  return {
    id: overrides.id ?? `entry-${Math.random().toString(36).slice(2, 8)}`,
    type: 'text',
    content: '',
    panel: 'free',
    characterTags: [],
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
    ...overrides,
  };
}

export function makeTimelineGroup(overrides: Partial<TimelineGroup> = {}): TimelineGroup {
  return {
    id: overrides.id ?? `tg-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 'session-test',
    label: 'テストグループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

export function makeMemoGroup(overrides: Partial<MemoGroup> = {}): MemoGroup {
  return {
    id: overrides.id ?? `mg-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 'session-test',
    panel: 'free',
    label: 'テストメモグループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

export function makeRelation(
  partial: Pick<CharacterRelation, 'fromCharacterId' | 'toCharacterId'> &
    Partial<CharacterRelation>,
): CharacterRelation {
  return {
    id: partial.id ?? `rel-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: 'session-test',
    label: '関係',
    sortOrder: 0,
    ...partial,
  };
}
