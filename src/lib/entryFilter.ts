/**
 * パネル内エントリの絞り込み述語（純関数）。
 *
 * memoPanel / timelinePanel / revealEntry で重複していた「キャラクター × 重要度」の AND 判定を
 * ここに一本化する。UI に依存しないためテスト可能（src/lib/__tests__/entryFilter.test.ts）。
 *
 * 各条件は「空＝絞り込みなし」。複数条件が有効な場合は AND（すべて満たすエントリのみ通す）。
 */
import type { Character, ImportanceLevel, MemoEntry } from '@/types/memo';

export interface EntryFilterCriteria {
  /** フィルタ対象キャラクター ID（空配列＝キャラ絞り込みなし） */
  characterIds: string[];
  /** フィルタ対象キャラクターの名前（本文中の名前一致用。空文字キャラは除外済みであること） */
  characterNames: string[];
  /** 表示する重要度レベル（空配列＝重要度絞り込みなし） */
  importanceLevels: ImportanceLevel[];
}

/**
 * キャラクター ID 配列から、本文一致用の名前リストを解決する。
 * 空文字名（未入力キャラ）は本文の任意位置に偽マッチするため除外する。
 */
export function resolveCharacterNames(characters: Character[], characterIds: string[]): string[] {
  return characters
    .filter((c) => characterIds.includes(c.id) && c.name.length > 0)
    .map((c) => c.name);
}

/** いずれかの絞り込み条件が有効か（フィルター中かどうかの判定 = DnD 抑止・空表示の判断に使う） */
export function isFilterActive(criteria: EntryFilterCriteria): boolean {
  return criteria.characterIds.length > 0 || criteria.importanceLevels.length > 0;
}

/** 単一エントリが全条件（AND）を満たすか判定する。 */
export function matchesEntryFilter(entry: MemoEntry, criteria: EntryFilterCriteria): boolean {
  // 重要度フィルタ: 指定レベルのいずれかに一致する重要度を持つエントリのみ
  if (criteria.importanceLevels.length > 0) {
    if (!entry.importance || !criteria.importanceLevels.includes(entry.importance)) {
      return false;
    }
  }

  // キャラクターフィルタ: タグ一致、または本文中にキャラ名を含むエントリのみ。
  // 空文字名は content.includes('') が常に true になり全エントリへ偽マッチするため除外する
  // （通常は resolveCharacterNames が除外済みだが、本体でも多層防御する）。
  if (criteria.characterIds.length > 0) {
    const byTag = criteria.characterIds.some((id) => entry.characterTags.includes(id));
    const byName = criteria.characterNames.some(
      (name) => name.length > 0 && entry.content.includes(name),
    );
    if (!byTag && !byName) return false;
  }

  return true;
}

/** エントリ配列を絞り込む（条件が無ければ元の配列をそのまま返す）。 */
export function filterEntries(entries: MemoEntry[], criteria: EntryFilterCriteria): MemoEntry[] {
  if (!isFilterActive(criteria)) return entries;
  return entries.filter((e) => matchesEntryFilter(e, criteria));
}
