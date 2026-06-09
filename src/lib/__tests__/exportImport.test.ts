import type {
  Character,
  MemoEntry,
  MemoGroup,
  MurderMemoExport,
  TimelineGroup,
} from '@/types/memo';
import { EXPORT_VERSION } from '@/types/memo';
import { formatBytes, migrateToLatest, validateExport } from '../exportImport';

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
    expect(
      validateExport(
        makeValidExport({
          entries: [],
          characters: [],
          timelineGroups: [],
          memoGroups: [],
          images: [],
        }),
      ),
    ).toBe(true);
  });

  it('画像データ付きでも valid', () => {
    expect(
      validateExport(
        makeValidExport({
          images: [{ blobKey: 'k1', mimeType: 'image/png', base64: 'abc123' }],
        }),
      ),
    ).toBe(true);
  });

  // 要素レベルの検証（import が前提とする参照フィールドの欠落を弾く）
  it('entry に characterTags が無いと false（import の .map クラッシュ防止）', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data.entries[0] as any).characterTags;
    expect(validateExport(data)).toBe(false);
  });

  it('entry に id が無いと false', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data.entries[0] as any).id;
    expect(validateExport(data)).toBe(false);
  });

  it('character に id が無いと false', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data.characters[0] as any).id;
    expect(validateExport(data)).toBe(false);
  });

  it('deductions が存在し characterId を欠くと false（remap(undefined) 防止）', () => {
    const data = makeValidExport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deductions: [{ id: 'd1' } as any],
    });
    expect(validateExport(data)).toBe(false);
  });

  it('relations が存在し from/to を欠くと false', () => {
    const data = makeValidExport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relations: [{ id: 'r1', fromCharacterId: 'c1' } as any],
    });
    expect(validateExport(data)).toBe(false);
  });

  it('正しい deductions / relations を持つデータは valid', () => {
    const data = makeValidExport({
      deductions: [
        {
          id: 'd1',
          sessionId: 's1',
          characterId: 'c1',
          suspicionLevel: 0,
          memo: '',
          updatedAt: 0,
        },
      ],
      relations: [
        {
          id: 'r1',
          sessionId: 's1',
          fromCharacterId: 'c1',
          toCharacterId: 'c1',
          label: '',
          sortOrder: 0,
        },
      ],
    });
    expect(validateExport(data)).toBe(true);
  });

  // 値域チェック（不正値の取り込み防止）
  it('session.name が文字列でないと false (#29)', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.session as any).name = undefined;
    expect(validateExport(data)).toBe(false);
  });

  it('entry.panel が不正な値だと false (#50)', () => {
    const data = makeValidExport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries: [{ id: 'e1', panel: 'bogus', characterTags: [] } as any],
    });
    expect(validateExport(data)).toBe(false);
  });

  it('deduction.suspicionLevel が範囲外(0-3)だと false (#23)', () => {
    const data = makeValidExport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deductions: [{ id: 'd1', characterId: 'c1', suspicionLevel: 9 } as any],
    });
    expect(validateExport(data)).toBe(false);
  });

  it('relation.label が文字列でないと false (#23)', () => {
    const data = makeValidExport({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relations: [{ id: 'r1', fromCharacterId: 'c1', toCharacterId: 'c1' } as any],
    });
    expect(validateExport(data)).toBe(false);
  });
});

// ─── マイグレーション (v1 → v2 linkKeywords 追加) ────────────────────────────

describe('migrateToLatest (v1 → v2: linkKeywords)', () => {
  /** v1 形式のエクスポートデータ（linkKeywords フィールドなし） */
  const v1Export = {
    version: 1 as const,
    exportedAt: 1700000000000,
    session: { id: 's1', name: '旧データ', createdAt: 0, updatedAt: 0 },
    entries: [makeEntry({ id: 'e1', content: '[凶器]はキッチン' })],
    characters: [makeChar({ id: 'c1', name: '医者' })],
    timelineGroups: [makeTlGroup({ id: 'tg1' })],
    memoGroups: [makeMemoGroup({ id: 'mg1' })],
    images: [],
    // deductions / relations / linkKeywords は欠落
  };

  it('v1 データ（linkKeywords 欠落）が v2 に移行され、空配列が補完される', () => {
    const migrated = migrateToLatest(v1Export);
    expect(migrated.version).toBe(EXPORT_VERSION);
    expect(migrated.linkKeywords).toEqual([]);
  });

  it('v1 移行後も既存フィールドは保持される', () => {
    const migrated = migrateToLatest(v1Export);
    expect(migrated.session.id).toBe('s1');
    expect(migrated.entries).toHaveLength(1);
    expect(migrated.entries[0].content).toBe('[凶器]はキッチン');
  });

  it('既に v2 のデータはそのまま返る（migration 不要）', () => {
    const v2 = makeValidExport({
      linkKeywords: [{ id: 'k1', keyword: '凶器', createdAt: 123 }],
    });
    const migrated = migrateToLatest(v2);
    expect(migrated.version).toBe(EXPORT_VERSION);
    expect(migrated.linkKeywords).toEqual([{ id: 'k1', keyword: '凶器', createdAt: 123 }]);
  });
});

describe('validateExport (linkKeywords は optional)', () => {
  it('v2 export に linkKeywords があれば valid', () => {
    expect(
      validateExport(makeValidExport({ linkKeywords: [{ id: 'k1', keyword: 'X', createdAt: 0 }] })),
    ).toBe(true);
  });

  it('v2 export で linkKeywords が省略されていても valid（optional フィールド）', () => {
    const data = makeValidExport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).linkKeywords;
    expect(validateExport(data)).toBe(true);
  });

  it('v1 形式の旧データも valid として受け入れる（後方互換）', () => {
    const v1Data = {
      version: 1,
      exportedAt: 1700000000000,
      session: { id: 's1', name: '旧データ', createdAt: 0, updatedAt: 0 },
      entries: [],
      characters: [],
      timelineGroups: [],
      memoGroups: [],
      images: [],
    };
    expect(validateExport(v1Data)).toBe(true);
  });
});

// ─── formatBytes ────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('バイト単位', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('KB 単位', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(10240)).toBe('10 KB');
  });

  it('MB 単位', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(52.5 * 1024 * 1024)).toBe('52.5 MB');
  });
});
