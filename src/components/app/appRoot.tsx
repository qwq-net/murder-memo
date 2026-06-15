import { useEffect } from 'react';

import { SelectionProvider } from '@/components/entries/selectionContext';
import { AppShell } from '@/components/layout/appShell';
import { makeT } from '@/lib/i18n';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { APP_VERSION } from '@/lib/version';
import { useStore } from '@/store';

/**
 * メモアプリ本体のルートコンポーネント。
 *
 * `src/pages/app/index.tsx` から `<ClientOnly>` + `lazy(() => import(...))` 経由で
 * 動的読み込みされる。これにより SSG 時にこのモジュールは評価されず、
 * IndexedDB / Zustand / @dnd-kit などの依存は LP / Guide のバンドルから完全に分離される。
 *
 * 旧 `src/app.tsx` の中身を移植したもの。
 */
export default function AppRoot() {
  const initSessions = useStore((s) => s.initSessions);
  const lastSeenVersion = useStore((s) => s.lastSeenVersion);
  const setWelcomeOpen = useStore((s) => s.setWelcomeOpen);
  const theme = useStore((s) => s.settings.theme);
  const language = useStore((s) => s.settings.language);

  // /app マウント時のみ html.app-mode を付与し、ビューポート固定 + テキスト選択禁止を有効化する
  // （LP / Guide ではこのクラスが付かないため、ふつうにスクロール / コピペできる）
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('app-mode');
    return () => {
      html.classList.remove('app-mode');
    };
  }, []);

  useEffect(() => {
    initSessions();
  }, [initSessions]);

  // テーマを document に反映（auto の場合は OS 設定に追従）
  useEffect(() => {
    const apply = (resolved: 'dark' | 'light') => {
      document.documentElement.dataset.theme = resolved;
    };

    if (theme !== 'auto') {
      apply(theme);
      return;
    }

    // OS 設定を検出して追従
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // 言語を document に反映（<html lang> とタブタイトル）。/app マウント時のみ走り、
  // SSG プリレンダーされた LP / Guide には影響しない（それらは別ルート）。
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = makeT(language)('app.title');
  }, [language]);

  // Undo / Redo キーボードショートカット
  useUndoRedo();

  // バージョンが異なる（または未保存）場合にウェルカムモーダルを表示
  useEffect(() => {
    if (lastSeenVersion !== APP_VERSION) {
      setWelcomeOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SelectionProvider>
      <AppShell />
    </SelectionProvider>
  );
}
