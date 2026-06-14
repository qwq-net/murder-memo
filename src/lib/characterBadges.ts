import { detectInlineCharacterIds } from '@/lib/parseCharacterText';
import type { Character, LinkKeyword, MemoEntry } from '@/types/memo';

/** バッジバー描画に必要な派生データ */
export interface BadgeCharacters {
  /** 本文中にインライン色付け済みのキャラクター ID（バッジから重複排除する対象） */
  inlineDetectedIds: string[];
  /** バッジバーに出すキャラクター（インライン検出済みを除いた可視キャラ） */
  badgeCharacters: Character[];
  /** タグ付け済みキャラクター ID の Set */
  activeCharacterIds: Set<string>;
  /** タグ付け or インライン検出のいずれかで実効的にアクティブなキャラが居るか */
  hasEffectiveActive: boolean;
}

/**
 * エントリ閲覧表示のバッジ計算を集約する純関数。
 *
 * TextEntryView / ImageEntryView で同一の派生計算が手書き重複していたものを切り出し、
 * 片方だけ直して挙動が乖離する事故を防ぐ。
 * （EntryContent（store 連携版）は別経路なので対象外）
 */
export function computeBadgeCharacters(
  entry: MemoEntry,
  visibleCharacters: Character[],
  linkKeywords: LinkKeyword[],
): BadgeCharacters {
  const inlineDetectedIds = detectInlineCharacterIds(
    entry.content,
    visibleCharacters,
    linkKeywords,
  );
  const badgeCharacters = visibleCharacters.filter((c) => !inlineDetectedIds.includes(c.id));
  const activeCharacterIds = new Set(entry.characterTags);
  const effective = new Set([...entry.characterTags, ...inlineDetectedIds]);
  const hasEffectiveActive = visibleCharacters.some((c) => effective.has(c.id));

  return { inlineDetectedIds, badgeCharacters, activeCharacterIds, hasEffectiveActive };
}
