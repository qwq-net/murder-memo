/**
 * パネルヘッダーに表示するキャラクター絞り込みバー（store 連携版）。
 * 表示は `CharacterFilterBarView` に委譲し、ここでは store から値・ハンドラを取得する。
 */
import { useMemo } from 'react';

import { CharacterFilterBarView } from '@/components/characters/characterFilterBarView';
import { sortCharactersByRole } from '@/lib/characterSort';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';

interface CharacterFilterBarProps {
  panelId: PanelId;
}

export function CharacterFilterBar({ panelId }: CharacterFilterBarProps) {
  const characters = useStore((s) => s.characters);
  const filterIds = useStore((s) => s.characterFilter[panelId]);
  const toggleCharacterFilter = useStore((s) => s.toggleCharacterFilter);
  const clearCharacterFilter = useStore((s) => s.clearCharacterFilter);

  // showInEntries が true のキャラのみ。プレイヤー → NPC、sortOrder 順
  const visible = useMemo(
    () => sortCharactersByRole(characters.filter((c) => c.showInEntries)),
    [characters],
  );

  return (
    <CharacterFilterBarView
      characters={visible}
      filterIds={filterIds}
      onToggle={(charId) => toggleCharacterFilter(panelId, charId)}
      onClear={() => clearCharacterFilter(panelId)}
    />
  );
}
