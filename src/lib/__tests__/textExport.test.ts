import type { Character, MemoEntry, MemoGroup, TimelineGroup } from '@/types/memo';
import { copyToClipboard, formatSessionAsText } from '../textExport';

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

// ─── formatSessionAsText ────────────────────────────────────────────────────

describe('formatSessionAsText', () => {
  const defaultOrder = ['free', 'timeline', 'personal'] as const;

  it('エントリがない場合は空文字を返す', () => {
    const result = formatSessionAsText('テスト', [], [], [], [], [...defaultOrder]);
    expect(result).toBe('');
  });

  it('セッション名がヘッダーに含まれる', () => {
    const entries = [makeEntry({ id: 'e1', content: 'メモ', panel: 'free' })];
    const result = formatSessionAsText('シナリオA', entries, [], [], [], [...defaultOrder]);
    expect(result).toMatch(/^# シナリオA/);
  });

  it('panelFilter 指定でヘッダーにパネル名が付く', () => {
    const entries = [makeEntry({ id: 'e1', content: 'メモ', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder], 'free');
    expect(result).toMatch(/^# テスト — フリーメモ/);
  });

  it('panelFilter で指定パネルのみ出力される', () => {
    const entries = [
      makeEntry({ id: 'e1', content: 'フリー', panel: 'free' }),
      makeEntry({ id: 'e2', content: '個人', panel: 'personal' }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder], 'personal');
    expect(result).toContain('個人');
    expect(result).not.toContain('フリー');
  });

  // ─── フリーメモ ─────────────────────────────────────────────────

  it('フリーメモのエントリが出力される', () => {
    const entries = [makeEntry({ id: 'e1', content: '重要な手がかり', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('## フリーメモ');
    expect(result).toContain('- 重要な手がかり');
  });

  it('メモグループありの場合グループ見出しが付く', () => {
    const groups = [makeMemoGroup({ id: 'g1', label: '推理', panel: 'free' })];
    const entries = [
      makeEntry({ id: 'e1', content: 'グループ内', panel: 'free', groupId: 'g1' }),
      makeEntry({ id: 'e2', content: '未分類', panel: 'free' }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], groups, [...defaultOrder]);
    expect(result).toContain('### 推理');
    expect(result).toContain('### 未分類');
  });

  it('グループなしの場合「未分類」見出しは出ない', () => {
    const entries = [makeEntry({ id: 'e1', content: 'メモ', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).not.toContain('### 未分類');
  });

  // ─── タイムライン ───────────────────────────────────────────────

  it('タイムラインは時刻付きで出力される', () => {
    const tlGroups = [makeTlGroup({ id: 'tg1', label: '当日' })];
    const entries = [
      makeEntry({
        id: 'e1',
        content: '被害者が書斎に入る',
        panel: 'timeline',
        timelineGroupId: 'tg1',
        eventTime: '12:30',
        eventTimeSortKey: 750,
      }),
    ];
    const result = formatSessionAsText('テスト', entries, [], tlGroups, [], [...defaultOrder]);
    expect(result).toContain('## タイムライン');
    expect(result).toContain('### 当日');
    expect(result).toContain('- 12:30 被害者が書斎に入る');
  });

  it('時刻未設定のタイムラインは ??:?? になる', () => {
    const tlGroups = [makeTlGroup({ id: 'tg1', label: '当日' })];
    const entries = [
      makeEntry({
        id: 'e1',
        content: '停電発生',
        panel: 'timeline',
        timelineGroupId: 'tg1',
      }),
    ];
    const result = formatSessionAsText('テスト', entries, [], tlGroups, [], [...defaultOrder]);
    expect(result).toContain('- ??:?? 停電発生');
  });

  it('タイムラインは時刻順でソートされる', () => {
    const tlGroups = [makeTlGroup({ id: 'tg1', label: '当日' })];
    const entries = [
      makeEntry({ id: 'e1', content: '後', panel: 'timeline', timelineGroupId: 'tg1', eventTime: '14:00', eventTimeSortKey: 840, sortOrder: 0 }),
      makeEntry({ id: 'e2', content: '先', panel: 'timeline', timelineGroupId: 'tg1', eventTime: '09:00', eventTimeSortKey: 540, sortOrder: 1 }),
    ];
    const result = formatSessionAsText('テスト', entries, [], tlGroups, [], [...defaultOrder]);
    const lines = result.split('\n');
    const entryLines = lines.filter((l) => l.startsWith('- '));
    expect(entryLines[0]).toContain('09:00 先');
    expect(entryLines[1]).toContain('14:00 後');
  });

  // ─── キャラクタータグ ───────────────────────────────────────────

  it('キャラクタータグが末尾に表示される', () => {
    const chars = [
      makeChar({ id: 'c1', name: '医者' }),
      makeChar({ id: 'c2', name: '執事' }),
    ];
    const entries = [
      makeEntry({ id: 'e1', content: '目撃情報', panel: 'free', characterTags: ['c1', 'c2'] }),
    ];
    const result = formatSessionAsText('テスト', entries, chars, [], [], [...defaultOrder]);
    expect(result).toContain('- 目撃情報 [医者, 執事]');
  });

  it('削除されたキャラクターの ID は無視される', () => {
    const chars = [makeChar({ id: 'c1', name: '医者' })];
    const entries = [
      makeEntry({ id: 'e1', content: 'メモ', panel: 'free', characterTags: ['c1', 'deleted-id'] }),
    ];
    const result = formatSessionAsText('テスト', entries, chars, [], [], [...defaultOrder]);
    expect(result).toContain('- メモ [医者]');
  });

  it('キャラクタータグが全て無効なら括弧は出ない', () => {
    const entries = [
      makeEntry({ id: 'e1', content: 'メモ', panel: 'free', characterTags: ['deleted'] }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- メモ');
    expect(result).not.toContain('[');
  });

  // ─── エッジケース ───────────────────────────────────────────────

  it('空コンテンツは（空）と表示される', () => {
    const entries = [makeEntry({ id: 'e1', content: '', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- （空）');
  });

  it('空白のみのコンテンツは（空）と表示される', () => {
    const entries = [makeEntry({ id: 'e1', content: '   ', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- （空）');
  });

  it('複数行コンテンツは " / " で結合される', () => {
    const entries = [makeEntry({ id: 'e1', content: '1行目\n2行目\n3行目', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- 1行目 / 2行目 / 3行目');
  });

  it('連続改行は1つの " / " にまとまる', () => {
    const entries = [makeEntry({ id: 'e1', content: '前\n\n\n後', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- 前 / 後');
  });

  it('画像エントリはキャプション付きで出力される', () => {
    const entries = [
      makeEntry({ id: 'e1', type: 'image', content: '証拠写真', panel: 'free', imageBlobKey: 'k1' }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- [画像] 証拠写真');
  });

  it('画像エントリでキャプションなしは [画像] のみ', () => {
    const entries = [
      makeEntry({ id: 'e1', type: 'image', content: '', panel: 'free', imageBlobKey: 'k1' }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('- [画像]');
  });

  // ─── パネル順序 ─────────────────────────────────────────────────

  it('panelOrder の順にセクションが出力される', () => {
    const entries = [
      makeEntry({ id: 'e1', content: 'フリー', panel: 'free' }),
      makeEntry({ id: 'e2', content: '個人', panel: 'personal' }),
    ];
    const result = formatSessionAsText('テスト', entries, [], [], [], ['personal', 'free', 'timeline']);
    const freeIdx = result.indexOf('## フリーメモ');
    const personalIdx = result.indexOf('## 自分用メモ');
    expect(personalIdx).toBeLessThan(freeIdx);
  });

  it('エントリのないパネルはセクション自体が出力されない', () => {
    const entries = [makeEntry({ id: 'e1', content: 'メモ', panel: 'free' })];
    const result = formatSessionAsText('テスト', entries, [], [], [], [...defaultOrder]);
    expect(result).toContain('## フリーメモ');
    expect(result).not.toContain('## タイムライン');
    expect(result).not.toContain('## 自分用メモ');
  });
});

// ─── copyToClipboard ────────────────────────────────────────────────────────

describe('copyToClipboard', () => {
  it('navigator.clipboard.writeText が成功すれば true を返す', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const result = await copyToClipboard('テスト');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('テスト');
  });

  it('navigator.clipboard が失敗した場合フォールバックする', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    // jsdom に execCommand がないので定義
    document.execCommand = vi.fn().mockReturnValue(true);
    const result = await copyToClipboard('テスト');
    expect(result).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
