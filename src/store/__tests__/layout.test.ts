/**
 * パネルレイアウト機能（グローバル / セッション2層）のストア統合を検証する。
 *
 * panelLayout.ts の純関数自体は panelLayout.test.ts で網羅済みのため、ここでは
 * 「2層の解決規則・所有レイヤーへのルーティング・楽観更新ロールバック・
 * activePanel ガード・検索ジャンプ時の自動再表示」というスライス間の結合挙動に絞る。
 *
 * 注意（entries.test.ts と同じ規約）:
 *   activeSessionId を変更すると store/index.ts の subscribe が全ローダーを呼ぶため、
 *   BySession ローダー群のモックを揃え、切り替えたテストの後始末で session-test へ戻して
 *   isSessionReady を待つ（待たないと非同期の loadEntries([]) が後続テストを汚染する）。
 *   切り替えていないテストでは subscribe が発火しないため待たない。
 */

const mockPutSession = vi.fn().mockResolvedValue(undefined);
const mockGetEntriesBySession = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/idb', () => ({
  putSession: (...args: unknown[]) => mockPutSession(...args),
  // セッション切替（store/index.ts の activeSessionId subscribe）が呼ぶローダー群。
  // createSession 等で activeSessionId が変わると subscribe が発火するため全ローダーを揃える
  getEntriesBySession: (...args: unknown[]) => mockGetEntriesBySession(...args),
  getCharactersBySession: vi.fn().mockResolvedValue([]),
  getTimelineGroupsBySession: vi.fn().mockResolvedValue([]),
  getMemoGroupsBySession: vi.fn().mockResolvedValue([]),
  getDeductionsBySession: vi.fn().mockResolvedValue([]),
  getRelationsBySession: vi.fn().mockResolvedValue([]),
  getLinkKeywordsBySession: vi.fn().mockResolvedValue([]),
}));

import {
  DEFAULT_PANEL_LAYOUT,
  layoutsEqual,
  setPanelHidden,
  visiblePanels,
} from '@/lib/panelLayout';
import { useStore } from '@/store/index';
import { selectResolvedLayout } from '@/store/selectors';
import type { AppSettings } from '@/store/slices/settings';
import type { GameSession, PanelLayout } from '@/types/memo';

// ─── テスト用ヘルパー ──────────────────────────────────────────────────────────

/** settings スライスの既定値（settings.ts の DEFAULT_SETTINGS 相当）を組み立てる */
function makeDefaultSettings(): AppSettings {
  return {
    inputPosition: 'bottom',
    language: 'ja',
    theme: 'auto',
    defaultCharacterDisplay: {
      free: { format: 'full', visibility: 'off' },
      timeline: { format: 'full', visibility: 'off' },
      personal: { format: 'full', visibility: 'off' },
    },
    layout: structuredClone(DEFAULT_PANEL_LAYOUT),
  };
}

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: overrides.id ?? 'session-test',
    name: 'テストセッション',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/**
 * 独自レイアウト（free+timeline を左カラムへ縦積み・personal を非表示）。
 * 既定（3列・全表示）とは columns 形状も hidden も異なるので「継承の同値/別参照」や
 * 「グローバル⇔セッションの解決切替」を区別しやすい。
 */
function makeCustomLayout(): PanelLayout {
  return {
    columns: [{ panels: ['free', 'timeline'], size: 100, rowSizes: [50, 50] }],
    hidden: ['personal'],
  };
}

describe('レイアウト2層（グローバル / セッション）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // settings スライスは localStorage を読む。テスト間の汚染を断つため都度クリアし、
    // ストアを既定 settings + session-test アクティブな素の状態へ戻す。
    localStorage.clear();
    useStore.setState({
      sessions: [makeSession()],
      activeSessionId: 'session-test',
      settings: makeDefaultSettings(),
      layoutDraft: null,
      activePanel: 'free',
    });
  });

  // 切り替えたテスト（createSession 等）の後始末。session-test へ戻しリロード完了を待つ。
  // 切り替えていないテストでは subscribe が発火せず isSessionReady が立たないため何もしない。
  afterEach(async () => {
    if (useStore.getState().activeSessionId !== 'session-test') {
      useStore.setState({ activeSessionId: 'session-test' });
      await vi.waitFor(() => expect(useStore.getState().isSessionReady).toBe(true));
    }
  });

  describe('createSession のグローバル継承', () => {
    it('settings.layout を複製して継承する（同値だが別参照）', async () => {
      const globalLayout = makeCustomLayout();
      useStore.setState({ settings: { ...makeDefaultSettings(), layout: globalLayout } });

      const created = await useStore.getState().createSession('新規');

      // 中身は同値だが…
      expect(created.layout).toBeDefined();
      expect(layoutsEqual(created.layout!, globalLayout)).toBe(true);
      // …参照は共有しない（後のセッション編集がグローバルを巻き込まないため structuredClone）
      expect(created.layout).not.toBe(globalLayout);
      expect(created.layout!.columns).not.toBe(globalLayout.columns);
      expect(created.layout!.hidden).not.toBe(globalLayout.hidden);
    });

    it('putSession に layout 付きのセッションを渡す', async () => {
      const globalLayout = makeCustomLayout();
      useStore.setState({ settings: { ...makeDefaultSettings(), layout: globalLayout } });

      const created = await useStore.getState().createSession('新規');

      expect(mockPutSession).toHaveBeenCalledTimes(1);
      const [saved] = mockPutSession.mock.calls[0] as [GameSession];
      expect(saved.id).toBe(created.id);
      expect(saved.layout).toBeDefined();
      expect(layoutsEqual(saved.layout!, globalLayout)).toBe(true);
    });
  });

  describe('selectResolvedLayout の解決順（layoutDraft → session.layout → settings.layout）', () => {
    it('session.layout があればそれが返る', () => {
      const sessionLayout = makeCustomLayout();
      useStore.setState({
        sessions: [makeSession({ layout: sessionLayout })],
        settings: { ...makeDefaultSettings(), layout: structuredClone(DEFAULT_PANEL_LAYOUT) },
      });

      expect(selectResolvedLayout(useStore.getState())).toBe(sessionLayout);
    });

    it('session.layout が無ければ settings.layout へフォールバックする', () => {
      const globalLayout = makeCustomLayout();
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: globalLayout },
      });

      expect(selectResolvedLayout(useStore.getState())).toBe(globalLayout);
    });

    it('layoutDraft があれば session.layout より優先される', () => {
      const draft = makeCustomLayout();
      const sessionLayout = structuredClone(DEFAULT_PANEL_LAYOUT);
      useStore.setState({
        sessions: [makeSession({ layout: sessionLayout })],
        layoutDraft: draft,
      });

      expect(selectResolvedLayout(useStore.getState())).toBe(draft);
    });
  });

  describe('updateSessionLayout', () => {
    it('楽観更新で該当セッションの layout が差し替わる', async () => {
      useStore.setState({
        sessions: [makeSession({ layout: structuredClone(DEFAULT_PANEL_LAYOUT) })],
      });
      const next = makeCustomLayout();

      await useStore.getState().updateSessionLayout(next);

      const session = useStore.getState().sessions.find((s) => s.id === 'session-test');
      expect(layoutsEqual(session!.layout!, next)).toBe(true);
      expect(mockPutSession).toHaveBeenCalledTimes(1);
    });

    it('putSession が失敗したら巻き戻し、エラートーストを積む', async () => {
      const original = structuredClone(DEFAULT_PANEL_LAYOUT);
      useStore.setState({ sessions: [makeSession({ layout: original })], toasts: [] });
      mockPutSession.mockRejectedValueOnce(new Error('IDB error'));

      await useStore.getState().updateSessionLayout(makeCustomLayout());

      // ロールバックで元の layout に戻る
      const session = useStore.getState().sessions.find((s) => s.id === 'session-test');
      expect(layoutsEqual(session!.layout!, original)).toBe(true);
      // エラートーストが積まれる
      expect(useStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
    });
  });

  describe('clearSessionLayout', () => {
    it('session.layout が消え、解決がグローバル設定へ戻る', async () => {
      const globalLayout = makeCustomLayout();
      useStore.setState({
        sessions: [makeSession({ layout: structuredClone(DEFAULT_PANEL_LAYOUT) })],
        settings: { ...makeDefaultSettings(), layout: globalLayout },
      });

      await useStore.getState().clearSessionLayout();

      const session = useStore.getState().sessions.find((s) => s.id === 'session-test');
      expect(session!.layout).toBeUndefined();
      // layout を持たないセッションはグローバルへフォールバックする
      expect(selectResolvedLayout(useStore.getState())).toBe(globalLayout);
      expect(mockPutSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateResolvedLayout の書き込み先ルーティング', () => {
    it('session.layout を持つ（=セッション固有中）ならセッションへ書き、settings は不変', async () => {
      const globalLayout = makeCustomLayout();
      useStore.setState({
        sessions: [makeSession({ layout: structuredClone(DEFAULT_PANEL_LAYOUT) })],
        settings: { ...makeDefaultSettings(), layout: globalLayout },
      });
      const next = makeCustomLayout();

      await useStore.getState().updateResolvedLayout(next);

      // セッションへ反映され putSession が走る
      const session = useStore.getState().sessions.find((s) => s.id === 'session-test');
      expect(layoutsEqual(session!.layout!, next)).toBe(true);
      expect(mockPutSession).toHaveBeenCalledTimes(1);
      // グローバル設定は触らない
      expect(useStore.getState().settings.layout).toBe(globalLayout);
    });

    it('session.layout が無い（=グローバル準拠中）なら settings へ書き、putSession は呼ばれない', async () => {
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: structuredClone(DEFAULT_PANEL_LAYOUT) },
      });
      const next = makeCustomLayout();

      await useStore.getState().updateResolvedLayout(next);

      // グローバル設定が更新される
      expect(layoutsEqual(useStore.getState().settings.layout, next)).toBe(true);
      // セッションへは書かない
      expect(mockPutSession).not.toHaveBeenCalled();
      const session = useStore.getState().sessions.find((s) => s.id === 'session-test');
      expect(session!.layout).toBeUndefined();
    });
  });

  describe('ensurePanelVisible（検索ジャンプ時の自動再表示）', () => {
    it('非表示パネルを指定すると所有レイヤーの hidden から外れる', () => {
      // personal を非表示にしたグローバル設定（セッションはグローバル準拠）
      const globalHidden = setPanelHidden(structuredClone(DEFAULT_PANEL_LAYOUT), 'personal', true);
      expect(globalHidden.hidden).toContain('personal');
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: globalHidden },
      });

      useStore.getState().ensurePanelVisible('personal');

      // 所有レイヤー（グローバル準拠中なので settings）へ再表示が書かれる
      const resolved = selectResolvedLayout(useStore.getState());
      expect(resolved.hidden).not.toContain('personal');
      expect(visiblePanels(resolved)).toContain('personal');
    });

    it('表示中のパネル指定は no-op（putSession も localStorage 書き込みも起きない）', () => {
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: structuredClone(DEFAULT_PANEL_LAYOUT) },
      });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // free は既定で表示中
      useStore.getState().ensurePanelVisible('free');

      expect(mockPutSession).not.toHaveBeenCalled();
      // updateSettings 由来の writeSettings（localStorage.setItem）も走らない
      expect(setItemSpy).not.toHaveBeenCalled();
      setItemSpy.mockRestore();
    });
  });

  describe('activePanel ガード（非表示パネルから先頭の表示パネルへ逃がす）', () => {
    it('activePanel を hidden 化するレイアウトを settings へ set すると先頭の表示パネルへ移る', () => {
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: structuredClone(DEFAULT_PANEL_LAYOUT) },
        activePanel: 'personal',
      });

      // personal を非表示にしたレイアウトをグローバルへ反映（subscribe が発火する）
      const hidden = setPanelHidden(structuredClone(DEFAULT_PANEL_LAYOUT), 'personal', true);
      useStore.getState().updateSettings({ layout: hidden });

      // activePanel が解決済みレイアウトの先頭表示パネルへ移る
      const resolved = selectResolvedLayout(useStore.getState());
      expect(resolved.hidden).toContain('personal');
      expect(useStore.getState().activePanel).toBe(visiblePanels(resolved)[0]);
      expect(useStore.getState().activePanel).not.toBe('personal');
    });
  });

  describe('revealEntry の自動再表示', () => {
    it('panel が非表示のエントリへ revealEntry すると hidden から外れる', () => {
      const globalHidden = setPanelHidden(structuredClone(DEFAULT_PANEL_LAYOUT), 'personal', true);
      useStore.setState({
        sessions: [makeSession({ layout: undefined })],
        settings: { ...makeDefaultSettings(), layout: globalHidden },
        characters: [],
        memoGroups: [],
        timelineGroups: [],
        uncategorizedCollapsed: {},
        characterFilter: { free: [], personal: [], timeline: [] },
        importanceFilter: { free: [], personal: [], timeline: [] },
      });

      useStore.getState().revealEntry({
        id: 'e1',
        type: 'text',
        content: '',
        panel: 'personal',
        characterTags: [],
        createdAt: 0,
        updatedAt: 0,
        sortOrder: 0,
      });

      const resolved = selectResolvedLayout(useStore.getState());
      expect(resolved.hidden).not.toContain('personal');
      expect(visiblePanels(resolved)).toContain('personal');
    });
  });
});
