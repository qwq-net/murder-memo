import { useEffect } from 'react';

import { AppShell } from './components/layout/AppShell';
import { SelectionProvider } from './components/entries/selection-context';
import { useStore } from './store';

export default function App() {
  const initSessions = useStore((s) => s.initSessions);

  useEffect(() => {
    initSessions();
  }, [initSessions]);

  return (
    <SelectionProvider>
      <AppShell />
    </SelectionProvider>
  );
}
