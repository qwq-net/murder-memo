import type { Character } from '@/types/memo';

/**
 * キャラクターを PL 優先・sortOrder 昇順でソートする。
 * characterFilterBar・AppShell 等で共通利用。
 */
export function sortCharactersByRole(characters: Character[]): Character[] {
  return [...characters].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * キャラクターを role 別に分離し、各グループを sortOrder 順で返す。
 * AppShell の行動順ストリップ用。
 */
export function splitCharactersByRole(characters: Character[]): {
  plChars: Character[];
  npcChars: Character[];
} {
  const plChars = characters
    .filter((c) => c.role === 'pl')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const npcChars = characters
    .filter((c) => c.role === 'npc')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { plChars, npcChars };
}
