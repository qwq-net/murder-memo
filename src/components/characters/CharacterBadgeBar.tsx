import { useStore } from '../../store';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, MemoEntry } from '../../types/memo';
import { CharacterBadge } from './CharacterBadge';

interface CharacterBadgeBarProps {
  entry: MemoEntry;
  /** 時刻欄分のインデントを追加（タイムラインエントリ用） */
  indent?: boolean;
  format: CharacterDisplayFormat;
  visibility: CharacterDisplayVisibility;
  isEntryHovered: boolean;
}

/**
 * ミニマルモード用ラッパー。非選択バッジを max-width + opacity で
 * 滑り込むようにアニメーション表示する。
 */
export function MinimalSlot({
  revealed,
  isActive,
  children,
}: {
  revealed: boolean;
  isActive: boolean;
  children: React.ReactNode;
}) {
  // 選択済みバッジは常に表示
  if (isActive) return <>{children}</>;

  return (
    <span
      style={{
        display: 'inline-flex',
        maxWidth: revealed ? 120 : 0,
        opacity: revealed ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out',
      }}
    >
      {children}
    </span>
  );
}

export function CharacterBadgeBar({ entry, indent, format, visibility, isEntryHovered }: CharacterBadgeBarProps) {
  const characters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  if (characters.length === 0) return null;
  if (visibility === 'off') return null;

  const isMinimal = visibility === 'minimal';

  // ミニマル: 常に全キャラをDOMに配置（アニメーション用）
  // 選択済みが0件かつ非ホバーなら何も表示しない
  if (isMinimal && !isEntryHovered && !characters.some((c) => entry.characterTags.includes(c.id))) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: isMinimal && !isEntryHovered ? 4 : 4,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
        padding: indent ? '1px 10px 1px 62px' : '1px 10px 1px',
      }}
    >
      {characters.map((char) => {
        const isActive = entry.characterTags.includes(char.id);
        const badge = (
          <CharacterBadge
            key={char.id}
            color={char.color}
            name={char.name}
            isActive={isActive}
            onClick={() => toggleCharacterTag(entry.id, char.id)}
            format={format}
          />
        );

        if (isMinimal) {
          return (
            <MinimalSlot key={char.id} revealed={isEntryHovered || isActive} isActive={isActive}>
              {badge}
            </MinimalSlot>
          );
        }

        return badge;
      })}
    </div>
  );
}
