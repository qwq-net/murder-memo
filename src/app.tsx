import { useEffect } from 'react';

import { AppShell } from '@/components/layout/appShell';
import { SelectionProvider } from '@/components/entries/selectionContext';
import { useStore } from '@/store';

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
