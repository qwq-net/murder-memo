import type { Character, MemoEntry, MemoGroup, MurderMemoExport, TimelineGroup } from '@/types/memo';
import { EXPORT_VERSION } from '@/types/memo';
import { validateExport } from '../exportImport';

// ─── テストデータ生成ヘルパー ─────────────────────────────────────────────────

function makeEntry(overrides: Partial<MemoEntry> & { id: string }): MemoEntry {
  return {
    type: 'text',
    content: '',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    ...overrides,
  };
}

function makeChar(overrides: Partial<Character> & { id: string; name: string }): Character {
  return {
    color: '#e74c3c',
    sortOrder: 0,
    role: 'pl',
    showInEntries: true,
    ...overrides,
  };
}

function makeTlGroup(overrides: Partial<TimelineGroup> & { id: string }): TimelineGroup {
  return {
    sessionId: 's1',
    label: 'グループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

function makeMemoGroup(overrides: Partial<MemoGroup> & { id: string }): MemoGroup {
  return {
    sessionId: 's1',
    panel: 'free',
    label: 'グループ',
    sortOrder: 0,
    collapsed: false,
    ...overrides,
  };
}

function makeValidExport(overrides?: Partial<MurderMemoExport>): MurderMemoExport {
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    session: { id: 's1', name: 'テストセッション', createdAt: 0, updatedAt: 0 },
    entries: [makeEntry({ id: 'e1', content: 'メモ' })],
    characters: [makeChar({ id: 'c1', name: '医者' })],
    timelineGroups: [makeTlGroup({ id: 'tg1' })],
    memoGroups: [makeMemoGroup({ id: 'mg1' })],
    images: [],
    ...overrides,
  };
}

// ─── validateExport ─────────────────────────────────────────────────────────

describe('validateExport', () => {
  it('正しいデータは true を返す', () => {
    expect(validateExport(makeValidExport())).toBe(true);
  });

  it('null は false を返す', () => {
    expect(validateExport(null)).toBe(false);
  });

  it('undefined は false を返す', () => {
    expect(validateExport(undefined)).toBe(false);
  });

  it('空オブジェクトは false を返す', () => {
    expect(validateExport({})).toBe(false);
  });

  it('version が未来のバージョンだと false を返す', () => {
    expect(validateExport(makeValidExport({ version: 999 as never }))).toBe(false);
  });

  it('version が 0 だと false を返す', () => {
    expect(validateExport(makeValidExport({ version: 0 as never }))).toBe(false);
  });

  it('version が文字列だと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), version: '1' })).toBe(false);
  });

  it('exportedAt がないと false を返す', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).exportedAt;
    expect(validateExport(data)).toBe(false);
  });

  it('session がないと false を返す', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).session;
    expect(validateExport(data)).toBe(false);
  });

  it('session.id がないと false を返す', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.session as any).id = 123;
    expect(validateExport(data)).toBe(false);
  });

  it('entries が配列でないと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), entries: 'not-array' })).toBe(false);
  });

  it('characters が配列でないと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), characters: null })).toBe(false);
  });

  it('timelineGroups が配列でないと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), timelineGroups: {} })).toBe(false);
  });

  it('memoGroups が配列でないと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), memoGroups: 42 })).toBe(false);
  });

  it('images が配列でないと false を返す', () => {
    expect(validateExport({ ...makeValidExport(), images: undefined })).toBe(false);
  });

  it('空配列でも valid', () => {
    expect(validateExport(makeValidExport({
      entries: [],
      characters: [],
      timelineGroups: [],
      memoGroups: [],
      images: [],
    }))).toBe(true);
  });

  it('画像データ付きでも valid', () => {
    expect(validateExport(makeValidExport({
      images: [{ blobKey: 'k1', mimeType: 'image/png', base64: 'abc123' }],
    }))).toBe(true);
  });
});
