/** links 名前空間：リンクキーワード辞書一覧モーダル関連の文言 */
export const links = {
  /** モーダルタイトル */
  heading: 'リンク一覧',
  /** 空状態メッセージ */
  empty: 'リンクが登録されていません',
  /** 空状態のサブテキスト前半（<code> の前） */
  emptyHintPre: 'メモに ',
  /** 空状態のサブテキスト中の <code> 内テキスト（書式例） */
  emptyHintCode: '[テキスト]',
  /** 空状態のサブテキスト後半（<code> の後） */
  emptyHintPost: ' 形式で書いて確定すると自動で登録されます',
  /** 削除確認ダイアログのタイトル（{name} = quoted keyword） */
  confirmDeleteTitle: '{name}を辞書から削除しますか？',
  /** 行削除ボタンの aria-label（{name} = quoted keyword） */
  removeAriaLabel: '{name}を削除',
} as const;
