/**
 * 検索オーバーレイのエントリ検索ロジック（純関数）。
 *
 * 旧実装は「本文の単一キーワード substring」だったが、ここでは:
 * - スペース区切りの**複数キーワード AND**（すべてのキーワードがどこかに一致するエントリのみ）
 * - 検索対象を**本文 + キャラクター名（タグ）+ 所属グループ名**に拡張
 * を行う。結果はパネル順にグループ化し、全体で maxResults 件までに打ち切る。
 *
 * UI から切り離してテスト可能にする（src/lib/__tests__/entrySearch.test.ts）。画像エントリは
 * 旧実装同様に検索対象外（遷移先・スニペット表示が本文前提のため挙動を変えない）。
 */
import type { Character, MemoEntry, MemoGroup, PanelId, TimelineGroup } from '@/types/memo';

export interface SearchContext {
  entries: MemoEntry[];
  characters: Character[];
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  /** パネル表示順（結果のグループ化順） */
  order: PanelId[];
  /** 結果の最大件数（全パネル合計） */
  maxResults: number;
}

/** 1 件のヒット。本文以外で一致した場合の付加情報を表示用に保持する。 */
export interface SearchMatch {
  entry: MemoEntry;
  /** いずれかのキーワードに一致したタグ付きキャラクター名（本文以外の一致理由の提示用） */
  matchedCharacterNames: string[];
  /** いずれかのキーワードに一致した所属グループ名（無ければ null） */
  matchedGroupLabel: string | null;
}

export interface SearchResultGroup {
  panel: PanelId;
  matches: SearchMatch[];
}

/** クエリ文字列をスペース区切りの小文字キーワード配列に分解する。 */
export function tokenizeQuery(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * エントリを検索してパネル順のグループ配列を返す。
 * キーワードが無い場合は空配列（呼び手は「未検索」として扱える）。
 */
export function searchEntries(query: string, ctx: SearchContext): SearchResultGroup[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return [];

  const charNameById = new Map(ctx.characters.map((c) => [c.id, c.name]));
  const tlLabelById = new Map(ctx.timelineGroups.map((g) => [g.id, g.label]));
  const memoLabelById = new Map(ctx.memoGroups.map((g) => [g.id, g.label]));

  let count = 0;
  const groups: SearchResultGroup[] = [];

  for (const panelId of ctx.order) {
    if (count >= ctx.maxResults) break;
    const matches: SearchMatch[] = [];

    for (const e of ctx.entries) {
      if (count >= ctx.maxResults) break;
      if (e.panel !== panelId) continue;
      if (e.type === 'image') continue;

      // タグ付けされたキャラクター名（空文字は偽マッチを避けるため除外）
      const tagNames = e.characterTags
        .map((id) => charNameById.get(id))
        .filter((n): n is string => !!n && n.length > 0);

      // 所属グループ名
      const groupLabel =
        e.panel === 'timeline'
          ? e.timelineGroupId
            ? tlLabelById.get(e.timelineGroupId)
            : undefined
          : e.groupId
            ? memoLabelById.get(e.groupId)
            : undefined;

      // 検索対象テキスト（本文・タグ名・グループ名）を小文字化して保持
      const haystacks = [e.content, ...tagNames, groupLabel ?? '']
        .filter(Boolean)
        .map((s) => s.toLowerCase());

      // AND: すべてのキーワードがいずれかの対象に一致すること
      const matchesAll = terms.every((t) => haystacks.some((h) => h.includes(t)));
      if (!matchesAll) continue;

      // 表示用の付加情報（本文以外で一致した理由を提示するため）
      const matchedCharacterNames = tagNames.filter((n) =>
        terms.some((t) => n.toLowerCase().includes(t)),
      );
      const labelMatched = !!groupLabel && terms.some((t) => groupLabel.toLowerCase().includes(t));

      matches.push({
        entry: e,
        matchedCharacterNames,
        matchedGroupLabel: labelMatched ? groupLabel! : null,
      });
      count++;
    }

    if (matches.length > 0) {
      groups.push({ panel: panelId, matches });
    }
  }

  return groups;
}
