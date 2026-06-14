import { useMemo } from 'react';

import { CharacterBadgeBarView } from '@/components/characters/characterBadgeBarView';
import { EntryContentView } from '@/components/entries/entryContentView';
import { computeBadgeCharacters } from '@/lib/characterBadges';
import type {
  Character,
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  LinkKeyword,
  MemoEntry,
} from '@/types/memo';

interface TextEntryViewProps {
  /** 表示するエントリ本体 */
  entry: MemoEntry;
  /** インライン色付け対象になる可視キャラクター（PL→NPC / sortOrder 順想定） */
  visibleCharacters: Character[];
  /** リンク辞書のキーワード */
  linkKeywords: LinkKeyword[];
  /** カード全体のホバー状態（バッジバーの minimal モード判定に流す） */
  isHovered: boolean;
  /** キャラクター表示形式（default を踏まえて呼び出し側で決定） */
  format: CharacterDisplayFormat;
  /** キャラクター表示モード */
  visibility: CharacterDisplayVisibility;
  /** 検索リンクのクリックハンドラ。Guide では noop でよい */
  onSearchClick?: (keyword: string) => void;
  /** バッジトグルのハンドラ。Guide では noop でよい */
  onCharacterToggle?: (characterId: string) => void;
}

/**
 * `TextEntry` の閲覧表示を切り出した純粋表示版。
 *
 * - 本文の `EntryContentView` + バッジバーの `CharacterBadgeBarView` を組み合わせる
 * - useStore に触れず、props で全データを受け取る
 * - 編集モード（textarea / 下書き保存）は持たない
 * - 本体の `EntryContent`（編集モード付き）と同じ DOM 構造になるよう、padding / 行高を揃える
 */
export function TextEntryView({
  entry,
  visibleCharacters,
  linkKeywords,
  isHovered,
  format,
  visibility,
  onSearchClick,
  onCharacterToggle,
}: TextEntryViewProps) {
  // バッジ計算は ImageEntryView と共通の純関数に集約
  const { badgeCharacters, activeCharacterIds, hasEffectiveActive } = useMemo(
    () => computeBadgeCharacters(entry, visibleCharacters, linkKeywords),
    [entry, visibleCharacters, linkKeywords],
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* テキスト（閲覧モード） */}
      <div className="pt-px pr-1 pb-0 pl-3.5 text-sm leading-[1.2] break-words whitespace-pre-wrap">
        <EntryContentView
          entry={entry}
          visibleCharacters={visibleCharacters}
          linkKeywords={linkKeywords}
          onSearchClick={onSearchClick}
        />
      </div>

      {/* 役職マーカー — テキストと同じ左右 padding で揃える */}
      <div className="pr-2.5 pb-0.5 pl-3.5">
        <CharacterBadgeBarView
          characters={badgeCharacters}
          activeCharacterIds={activeCharacterIds}
          onToggle={onCharacterToggle ?? (() => undefined)}
          format={format}
          visibility={visibility}
          isEntryHovered={isHovered}
          hasEffectiveActive={hasEffectiveActive}
        />
      </div>
    </div>
  );
}
