import { useEffect } from 'react';

import { AppShell } from '@/components/layout/appShell';
import { SelectionProvider } from '@/components/entries/selectionContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { APP_VERSION } from '@/lib/version';
import { useStore } from '@/store';

export default function App() {
  const initSessions = useStore((s) => s.initSessions);
  const lastSeenVersion = useStore((s) => s.lastSeenVersion);
  const setWelcomeOpen = useStore((s) => s.setWelcomeOpen);
  const theme = useStore((s) => s.settings.theme);

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
