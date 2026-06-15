/** search 名前空間：検索オーバーレイ関連の文言 */
export const search = {
  /** 検索入力のプレースホルダ */
  placeholder: 'エントリを検索…',
  /** クリアボタンの aria-label */
  clearLabel: 'クリア',
  /** 該当なしのメッセージ */
  noResults: '該当するエントリが見つかりません',
  /** パネルグループ内の件数表示（N件） */
  groupCount: '{n}件',
  /** フッターの結果件数（N件の結果） */
  resultCount: { one: '{n}件の結果', other: '{n}件の結果' },
  /** 結果件数が上限に達したときのサフィックス */
  maxReachedSuffix: '（上限）',
  /** エントリを表示できなかったときのエラートースト */
  errorReveal: '対象のメモを表示できませんでした',
} as const;
