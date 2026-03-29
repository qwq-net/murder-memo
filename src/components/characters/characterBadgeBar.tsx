import { useStore } from '@/store';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, MemoEntry } from '@/types/memo';
import { CharacterBadge } from '@/components/characters/characterBadge';

interface CharacterBadgeBarProps {
  entry: MemoEntry;
  format: CharacterDisplayFormat;
  visibility: CharacterDisplayVisibility;
  isEntryHovered: boolean;
  /** テキスト中にインライン表示済みのキャラID。バーから除外して重複を防ぐ */
  inlineDetectedIds?: string[];
}

/**
 * ミニマルモード用ラッパー。非選択バッジを max-width + opacity で
 * 滑り込むようにアニメーション表示する。
 * 非表示時は幅・マージンともに 0 にして余白を生まない。
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
  // 選択済みバッジは常に表示（gap:0 なのでマージンでスペーシング）
  if (isActive) {
    return <span style={{ display: 'inline-flex', marginRight: 1 }}>{children}</span>;
  }

  return (
    <span
      style={revealed ? {
        display: 'inline-flex',
        maxWidth: 120,
        marginRight: 1,
        opacity: 1,
        overflow: 'hidden',
        transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out, margin 0.2s ease-out',
      } : {
        display: 'inline-flex',
        maxWidth: 0,
        minWidth: 0,
        width: 0,
        marginRight: 0,
        padding: 0,
        opacity: 0,
        overflow: 'hidden',
        flex: '0 0 0',
        transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out, margin 0.2s ease-out',
      }}
    >
      {children}
    </span>
  );
}

/**
 * エントリに紐づくキャラクターバッジ一覧。
 *
 * レイアウトの責務分担:
 *   - 外側の padding（テキストとの左揃え）は親コンポーネント（EntryContent）が担当
 *   - このコンポーネントはバッジ間の間隔のみ管理（CSS gap）
 *   - ミニマルモードでは gap が非表示要素に効かないよう gap: 0 にし、
 *     MinimalSlot 側で幅制御のみ行う
 */
export function CharacterBadgeBar({ entry, format, visibility, isEntryHovered, inlineDetectedIds }: CharacterBadgeBarProps) {
  const allCharacters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  // showInEntries が true かつインライン未表示のキャラのみ。プレイヤー → NPC の順、その中で行動順（sortOrder）
  const characters = allCharacters
    .filter((c) => c.showInEntries && !inlineDetectedIds?.includes(c.id))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });

  if (characters.length === 0) return null;
  if (visibility === 'off') return null;

  const isMinimal = visibility === 'minimal';
  // collapsed 判定: 手動タグ（characterTags）とインライン検出（inlineDetectedIds）の
  // 和集合で「実効アクティブ」を判定する。インライン表示済みキャラはバーから除外されているが、
  // 1件でも実効アクティブがあればバーを展開してタグ付け操作をしやすくする
  const effectiveActiveIds = new Set([
    ...entry.characterTags,
    ...(inlineDetectedIds ?? []),
  ]);
  const hasActive = allCharacters.some((c) => effectiveActiveIds.has(c.id));
  // ミニマル: 実効アクティブが0件かつ非ホバーなら高さを畳む（DOMは維持してアニメーション可能に）
  const collapsed = isMinimal && !isEntryHovered && !hasActive;

  return (
    <div
      style={{
        display: 'flex',
        // ミニマルモードでは gap が非表示(width:0)要素にも効くため 0 にする
        // 通常モードは gap で均等スペーシング（折り返し時も2行目先頭にズレなし）
        columnGap: isMinimal ? 0 : 1,
        rowGap: isMinimal ? 0 : 1,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
        // 外側 padding は親（EntryContent）に委譲。ここでは上下余白のみ
        padding: 0,
        opacity: collapsed ? 0 : 1,
        height: collapsed ? 0 : 'auto',
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {characters.map((char) => {
        const isActive = entry.characterTags.includes(char.id);
        const revealed = isEntryHovered || isActive;
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
