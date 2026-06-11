import { captureSessionRollback } from '../optimisticRollback';

interface TestState {
  activeSessionId: string | null;
  entries: string[];
}

/** フェイクの get/set ペアを作る（Zustand を介さずヘルパー単体を検証する） */
function makeFakeStore(initial: TestState) {
  let state = initial;
  const get = () => state;
  const set = (fn: (s: TestState) => Partial<TestState>) => {
    state = { ...state, ...fn(state) };
  };
  return { get, set };
}

describe('captureSessionRollback', () => {
  it('セッションが同一ならスナップショットを参照ごと書き戻す', () => {
    const snapshot = ['a', 'b'];
    const { get, set } = makeFakeStore({ activeSessionId: 's1', entries: snapshot });
    const rollback = captureSessionRollback(get, set, { entries: snapshot });

    // 楽観更新で書き換わった後にロールバック
    set(() => ({ entries: ['a', 'b', 'c'] }));
    rollback();

    // 参照そのものが復元される（参照比較の Undo 履歴を汚さない契約）
    expect(get().entries).toBe(snapshot);
  });

  it('セッションが切り替わっていたら巻き戻さない', () => {
    const { get, set } = makeFakeStore({ activeSessionId: 's1', entries: ['old'] });
    const rollback = captureSessionRollback(get, set, { entries: ['old'] });

    // await 中にセッション切替＋リロードが完了した状況を再現
    const reloaded = ['new-session-data'];
    set(() => ({ activeSessionId: 's2', entries: reloaded }));
    rollback();

    // 新セッションのデータが保持される（旧スナップショットで上書きしない）
    expect(get().entries).toBe(reloaded);
  });

  it('null セッションのまま（未切替）なら巻き戻す', () => {
    const snapshot = ['a'];
    const { get, set } = makeFakeStore({ activeSessionId: null, entries: snapshot });
    const rollback = captureSessionRollback(get, set, { entries: snapshot });

    set(() => ({ entries: ['a', 'b'] }));
    rollback();

    expect(get().entries).toBe(snapshot);
  });

  it('複数キーのスナップショット（カスケード削除相当）も書き戻せる', () => {
    interface MultiState {
      activeSessionId: string | null;
      entries: string[];
      memoGroups: string[];
    }
    let state: MultiState = { activeSessionId: 's1', entries: ['e1'], memoGroups: ['g1'] };
    const get = () => state;
    const set = (fn: (s: MultiState) => Partial<MultiState>) => {
      state = { ...state, ...fn(state) };
    };
    const prevEntries = state.entries;
    const prevGroups = state.memoGroups;
    const rollback = captureSessionRollback(get, set, {
      entries: prevEntries,
      memoGroups: prevGroups,
    });

    set(() => ({ entries: [], memoGroups: [] }));
    rollback();

    expect(get().entries).toBe(prevEntries);
    expect(get().memoGroups).toBe(prevGroups);
  });
});
