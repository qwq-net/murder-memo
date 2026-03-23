import { navigateToEntry } from '../entryNavigation';

describe('navigateToEntry', () => {
  const setActivePanel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setActivePanel を指定パネルで呼ぶ', () => {
    navigateToEntry('entry-1', 'timeline', setActivePanel);
    expect(setActivePanel).toHaveBeenCalledWith('timeline');
  });

  it('requestAnimationFrame 内でスクロールとフラッシュアニメーションを実行する', () => {
    // テスト用 DOM 要素を作成
    const el = document.createElement('div');
    el.setAttribute('data-entry-id', 'entry-2');
    el.scrollIntoView = vi.fn();
    el.classList.add = vi.fn();
    el.classList.remove = vi.fn();
    el.addEventListener = vi.fn();
    Object.defineProperty(el, 'offsetWidth', { get: () => 100 });
    document.body.appendChild(el);

    navigateToEntry('entry-2', 'free', setActivePanel);

    // requestAnimationFrame コールバックを実行
    vi.advanceTimersByTime(16);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(el.classList.remove).toHaveBeenCalledWith('entry-flash');
    expect(el.classList.add).toHaveBeenCalledWith('entry-flash');

    document.body.removeChild(el);
  });

  it('要素が見つからない場合はエラーにならない', () => {
    navigateToEntry('nonexistent', 'personal', setActivePanel);
    // requestAnimationFrame コールバックを実行
    vi.advanceTimersByTime(16);
    // エラーが発生しないことを確認
    expect(setActivePanel).toHaveBeenCalledWith('personal');
  });
});
