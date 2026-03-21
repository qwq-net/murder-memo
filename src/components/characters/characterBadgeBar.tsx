import { useStore } from '@/store';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, MemoEntry } from '@/types/memo';
import { CharacterBadge } from '@/components/characters/characterBadge';

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
  isFirst,
  children,
}: {
  revealed: boolean;
  isActive: boolean;
  isFirst: boolean;
  children: React.ReactNode;
}) {
  // 選択済みバッジは常に表示（gap=0 なので自前でマージン）
  if (isActive) {
    return <span style={{ display: 'inline-flex', marginLeft: isFirst ? 0 : 4 }}>{children}</span>;
  }

  return (
    <span
      style={revealed ? {
        display: 'inline-flex',
        maxWidth: 120,
        marginLeft: isFirst ? 0 : 4,
        opacity: 1,
        overflow: 'hidden',
        transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out, margin-left 0.2s ease-out',
      } : {
        display: 'inline-flex',
        maxWidth: 0,
        minWidth: 0,
        width: 0,
        marginLeft: 0,
        padding: 0,
        opacity: 0,
        overflow: 'hidden',
        flex: '0 0 0',
        transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out, margin-left 0.2s ease-out',
      }}
    >
      {children}
    </span>
  );
}

export function CharacterBadgeBar({ entry, indent, format, visibility, isEntryHovered }: CharacterBadgeBarProps) {
  const allCharacters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  // showInEntries が true のキャラのみ表示。PL → NPC の順、その中で行動順（sortOrder）
  const characters = allCharacters
    .filter((c) => c.showInEntries)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  if (characters.length === 0) return null;
  if (visibility === 'off') return null;

  const isMinimal = visibility === 'minimal';
  const hasActive = characters.some((c) => entry.characterTags.includes(c.id));
  // ミニマル: 選択済みが0件かつ非ホバーなら高さを畳む（DOMは維持してアニメーション可能に）
  const collapsed = isMinimal && !isEntryHovered && !hasActive;

  return (
    <div
      style={{
        display: 'flex',
        gap: isMinimal ? 0 : 4,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
        padding: indent ? '1px 10px 1px 74px' : '1px 10px 1px',
        opacity: collapsed ? 0 : 1,
        height: collapsed ? 0 : 'auto',
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {characters.map((char, i) => {
        const isActive = entry.characterTags.includes(char.id);
        const revealed = isEntryHovered || isActive;
        // 最初に「表示される」バッジかどうか（ホバー時は0番目、非ホバー時は最初のアクティブ）
        const isFirstVisible = isMinimal && (
          isEntryHovered
            ? i === 0
            : characters.findIndex((c) => entry.characterTags.includes(c.id)) === i
        );
        const badge = (
          <CharacterBadge
            key={char.id}
            color={char.color}
            name={char.name}
            isActive={isActive}
            onClick={(e) => { if (!e.shiftKey) toggleCharacterTag(entry.id, char.id); }}
            format={format}
          />
        );

        if (isMinimal) {
          return (
            <MinimalSlot key={char.id} revealed={revealed} isActive={isActive} isFirst={isFirstVisible}>
              {badge}
            </MinimalSlot>
          );
        }

        return badge;
      })}
    </div>
  );
}
