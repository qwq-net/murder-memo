/** 全機能で共有する汎用ラベル。新規キーは各機能の名前空間に置き、ここは横断的なものだけ。 */
export const common = {
  uncategorized: '未分類',
  /** 名前等を括弧でくくる（括弧の流儀は言語ごとに変える）。 */
  quoted: '「{label}」',
  close: '閉じる',
  cancel: '取り消し',
  save: '保存',
  delete: '削除',
  edit: '編集',
  add: '追加',
  reset: 'リセット',
  contextMenuAria: 'コンテキストメニュー',
  groupNamePlaceholder: 'メモグループ名',
  createGroup: 'メモグループを作成',
  searchKeyword: '{label}を検索',
} as const;
