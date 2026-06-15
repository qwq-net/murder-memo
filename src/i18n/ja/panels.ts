export const panels = {
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
  /** `${label}（非表示中）` のサフィックス。 */
  hiddenSuffix: '（非表示中）',
  /** タイムラインの時刻未設定エントリの見出し。 */
  unknownTime: '不明',
  // グループ操作トースト（メモ / タイムライン共通）
  groupRenamed: 'グループ名を変更しました',
  groupDeleted: 'グループを削除しました',
  groupAdded: 'グループを追加しました',
  imageAdded: '画像を追加しました',
  // グループ削除の確認モーダル
  deleteGroupTitle: '{label}を削除',
  deleteGroupConfirmTimeline: {
    one: 'メモが {n}件 一緒に削除されることを理解しました',
    other: 'メモが {n}件 一緒に削除されることを理解しました',
  },
  deleteGroupConfirmMemo: {
    one: '未分類へメモが {n}件 移動することを理解しました',
    other: '未分類へメモが {n}件 移動することを理解しました',
  },
  // 空状態メッセージ
  emptyFree: 'メモを書き殴ろう',
  emptyPersonal: 'ハンドアウトや個人情報をメモ',
  emptyTimelineAddGroup: 'メモグループを追加してタイムラインを整理しよう',
  // タイムライングループ内の案内
  dropToClearTime: 'ここへドロップで時刻なし',
  addMemoPrompt: 'メモを追加してください',
  // フィルター適用時に一致なし
  noFilterMatch: 'フィルター条件に一致するメモはありません',
  // タイムラインの未分類（孤児）セクション
  unassignedTimelineHint:
    'どのグループにも属していないメモです。ドラッグまたは右クリックでグループへ移動できます。',
} as const;
