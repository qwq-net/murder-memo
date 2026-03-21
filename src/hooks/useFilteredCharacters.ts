import { useMemo } from 'react';

import { splitCharactersByRole } from '@/lib/characterSort';
import { useStore } from '@/store';

/**
 * ストアのキャラクターを PL/NPC に分離して返すフック。
 * AppShell の行動順ストリップで利用。
 */
export function useFilteredCharacters() {
  const characters = useStore((s) => s.characters);
  return useMemo(() => splitCharactersByRole(characters), [characters]);
}
