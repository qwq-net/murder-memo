import { useEffect } from 'react';

import { AppShell } from '@/components/layout/appShell';
import { SelectionProvider } from '@/components/entries/selectionContext';
import { APP_VERSION } from '@/lib/version';
import { useStore } from '@/store';

export default function App() {
  const initSessions = useStore((s) => s.initSessions);
  const lastSeenVersion = useStore((s) => s.lastSeenVersion);
  const setWelcomeOpen = useStore((s) => s.setWelcomeOpen);

  useEffect(() => {
    initSessions();
  }, [initSessions]);

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
