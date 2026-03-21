/**
 * パネルヘッダーに表示するキャラクター絞り込みバー。
 * バッジをクリックしてトグル選択し、エントリを該当キャラで絞り込む。
 */
import { useMemo } from 'react';

import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';
import { CharacterBadge } from '@/components/characters/characterBadge';
import { X } from '@/components/icons';

interface CharacterFilterBarProps {
  panelId: PanelId;
}

export function CharacterFilterBar({ panelId }: CharacterFilterBarProps) {
  const characters = useStore((s) => s.characters);
  const filterIds = useStore((s) => s.characterFilter[panelId]);
  const toggleCharacterFilter = useStore((s) => s.toggleCharacterFilter);
  const clearCharacterFilter = useStore((s) => s.clearCharacterFilter);

  // showInEntries が true のキャラのみ。PL → NPC、sortOrder 順
  const visible = useMemo(
    () =>
      characters
        .filter((c) => c.showInEntries)
        .sort((a, b) => {
          if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        }),
    [characters],
  );

  if (visible.length === 0) return null;

  const hasActiveFilter = filterIds.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {visible.map((char) => {
        const active = filterIds.includes(char.id);
        return (
          <CharacterBadge
            key={char.id}
            color={char.color}
            name={char.name}
            isActive={active}
            onClick={(e) => {
              e.stopPropagation();
              toggleCharacterFilter(panelId, char.id);
            }}
            format="badge"
            ariaLabel={`${char.name}${active ? 'のフィルターを解除' : 'でフィルター'}`}
          />
        );
      })}
      {hasActiveFilter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            clearCharacterFilter(panelId);
          }}
          className="btn-ghost btn-sm"
          title="フィルターをクリア"
          aria-label="キャラクターフィルターをクリア"
          style={{ marginLeft: 2, padding: 2 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
