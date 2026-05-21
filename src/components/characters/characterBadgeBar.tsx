import { useMemo } from 'react';

import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { useStore } from '@/store';
import type { CharacterDisplayFormat, CharacterDisplayVisibility, MemoEntry } from '@/types/memo';

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
 *
 * NOTE: `CharacterBadgeBarView` から re-import される（store 依存ゼロ）。
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
      style={
        revealed
          ? {
              display: 'inline-flex',
              maxWidth: 120,
              marginRight: 1,
              opacity: 1,
              overflow: 'hidden',
              transition: 'max-width 0.2s ease-out, opacity 0.15s ease-out, margin 0.2s ease-out',
            }
          : {
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
            }
      }
    >
      {children}
    </span>
  );
}

/**
 * エントリに紐づくキャラクターバッジ一覧（store 連携版）。
 *
 * store からキャラ一覧 / トグル関数を取得し、`CharacterBadgeBarView` に流す薄いラッパー。
 * 並べ替え（PL→NPC / sortOrder）とインライン検出済みキャラの除外もここで行う。
 *
 * レイアウトの責務分担:
 *   - 外側の padding（テキストとの左揃え）は親（EntryContent）が担当
 *   - このコンポーネントはバッジ間の間隔のみ View 経由で管理
 */
export function CharacterBadgeBar({
  entry,
  format,
  visibility,
  isEntryHovered,
  inlineDetectedIds,
}: CharacterBadgeBarProps) {
  const allCharacters = useStore((s) => s.characters);
  const toggleCharacterTag = useStore((s) => s.toggleCharacterTag);

  // showInEntries が true かつインライン未表示のキャラのみ。PL→NPC、その中で行動順（sortOrder）
  const characters = useMemo(
    () =>
      allCharacters
        .filter((c) => c.showInEntries && !inlineDetectedIds?.includes(c.id))
        .sort((a, b) => {
          if (a.role !== b.role) return a.role === 'pl' ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        }),
    [allCharacters, inlineDetectedIds],
  );

  // 実効アクティブ判定（手動タグ + インライン検出の和集合）
  const activeCharacterIds = useMemo(() => new Set(entry.characterTags), [entry.characterTags]);
  const hasEffectiveActive = useMemo(() => {
    const effective = new Set([...entry.characterTags, ...(inlineDetectedIds ?? [])]);
    return allCharacters.some((c) => effective.has(c.id));
  }, [allCharacters, entry.characterTags, inlineDetectedIds]);

  return (
    <CharacterBadgeBarView
      characters={characters}
      activeCharacterIds={activeCharacterIds}
      onToggle={(id) => toggleCharacterTag(entry.id, id)}
      format={format}
      visibility={visibility}
      isEntryHovered={isEntryHovered}
      hasEffectiveActive={hasEffectiveActive}
    />
  );
}
