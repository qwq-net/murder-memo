import { CharacterBadge } from '@/components/characters/characterBadge';
import { MinimalSlot } from '@/components/characters/characterBadgeBar';
import type { Character, CharacterDisplayFormat, CharacterDisplayVisibility } from '@/types/memo';

export interface CharacterBadgeBarViewProps {
  /** 表示対象のキャラクター（PL→NPC / sortOrder 順に並べ替え済みであること） */
  characters: Character[];
  /** アクティブな（タグ付け済み）キャラクター ID のセット */
  activeCharacterIds: Set<string>;
  /** バッジクリック時のコールバック（Shift+クリックは呼び出し側で除外する） */
  onToggle: (characterId: string) => void;
  /** 表示形式（text 形式の名前バッジ / dot 形式の色丸） */
  format: CharacterDisplayFormat;
  /** 表示モード: always = 常時表示 / minimal = ホバー / アクティブ時のみ / off = 非表示 */
  visibility: CharacterDisplayVisibility;
  /** 親エントリのホバー状態。minimal モードで畳むかどうかの判定に使う */
  isEntryHovered: boolean;
  /** 実効アクティブ（手動タグ + インライン検出済み）の有無。minimal モードの collapse 判定用 */
  hasEffectiveActive: boolean;
}

/**
 * `CharacterBadgeBar` から useStore を切り離した純粋表示版。
 *
 * - props で `characters` と active セットを受け取り、`useStore` には触れない
 * - Guide ページなど、本物の store に依存できない場所でそのまま使える
 *
 * `CharacterBadgeBar`（store ラッパー）から呼ばれることを想定するが、
 * 単独でも使える設計にしている（並べ替えやインライン検出の責務は呼び出し側）。
 */
export function CharacterBadgeBarView({
  characters,
  activeCharacterIds,
  onToggle,
  format,
  visibility,
  isEntryHovered,
  hasEffectiveActive,
}: CharacterBadgeBarViewProps) {
  if (characters.length === 0) return null;
  if (visibility === 'off') return null;

  const isMinimal = visibility === 'minimal';
  // minimal: 実効アクティブが0件かつ非ホバーなら高さを畳む（DOM は保持しアニメーション可能に）
  const collapsed = isMinimal && !isEntryHovered && !hasEffectiveActive;

  return (
    <div
      style={{
        display: 'flex',
        // minimal モードでは gap が非表示(width:0)要素にも効くため 0 にする
        columnGap: isMinimal ? 0 : 1,
        rowGap: isMinimal ? 0 : 1,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
        padding: 0,
        opacity: collapsed ? 0 : 1,
        height: collapsed ? 0 : 'auto',
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {characters.map((char) => {
        const isActive = activeCharacterIds.has(char.id);
        const revealed = isEntryHovered || isActive;
        const badge = (
          <CharacterBadge
            key={char.id}
            color={char.color}
            name={char.name}
            isActive={isActive}
            onClick={(e) => {
              if (!e.shiftKey) onToggle(char.id);
            }}
            format={format}
          />
        );

        if (isMinimal) {
          return (
            <MinimalSlot key={char.id} revealed={revealed} isActive={isActive}>
              {badge}
            </MinimalSlot>
          );
        }

        return badge;
      })}
    </div>
  );
}
