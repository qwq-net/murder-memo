import { CharacterBadge } from '@/components/characters/characterBadge';
import { X } from '@/components/icons';
import { useT } from '@/i18n';
import type { Character } from '@/types/memo';

interface CharacterFilterBarViewProps {
  /** 表示するキャラクター一覧（PL→NPC / sortOrder 順、`showInEntries` 済みであること） */
  characters: Character[];
  /** 現在アクティブなフィルタ対象キャラクター ID */
  filterIds: string[];
  /** バッジクリック時のトグル */
  onToggle: (characterId: string) => void;
  /** クリアボタンクリック */
  onClear: () => void;
}

/**
 * パネルヘッダー右側に出るキャラクター絞り込みバーの純粋表示版。
 *
 * - props で全データを受け取り、`useStore` には触れない
 * - キャラクターが 1 件もなければ何も描画しない（呼び出し側で事前にフィルタしない場合の保険）
 */
export function CharacterFilterBarView({
  characters,
  filterIds,
  onToggle,
  onClear,
}: CharacterFilterBarViewProps) {
  const t = useT();
  if (characters.length === 0) return null;
  const hasActiveFilter = filterIds.length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {characters.map((char) => {
        const active = filterIds.includes(char.id);
        return (
          <CharacterBadge
            key={char.id}
            color={char.color}
            name={char.name}
            isActive={active}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(char.id);
            }}
            format="badge"
            ariaLabel={
              active
                ? t('characters.badge.filterOff', { name: char.name })
                : t('characters.badge.filterOn', { name: char.name })
            }
          />
        );
      })}
      {hasActiveFilter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="btn-ghost btn-sm"
          title={t('characters.filter.clearTitle')}
          aria-label={t('characters.filter.clearLabel')}
          style={{ marginLeft: 2, padding: 2 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
