/** 相関図機能の日本語カタログ。 */
export const relations = {
  /** モーダルタイトル */
  title: '相関図',
  /** タブラベル */
  tabList: 'リスト',
  tabDiagram: '図',
  /** 登場人物が2人未満のときの案内 */
  needMoreChars: '登場人物を2人以上設定してください',
  /** 追加フォームの見出し */
  addHeading: '関係を追加',
  /** セレクトボックスのプレースホルダー */
  person1Placeholder: '人物1',
  person2Placeholder: '人物2',
  /** ラベル入力のプレースホルダー */
  labelPlaceholder: '関係（例: 友人）',
  /** カラーピッカーボタンの title */
  colorPickerTitle: '線の色を選択',
  /** 関係削除ボタンの title */
  removeRelationTitle: '関係を削除',
  /** トースト */
  toastAdded: '関係を追加しました',
  toastRemoved: '関係を削除しました',
  /** ズームリセットボタン */
  resetZoom: 'リセット',
  /** プリセットラベル（表示用チップ） */
  presets: {
    friend: '友人',
    lover: '恋人',
    family: '家族',
    boss: '上司部下',
    enemy: '敵対',
    ally: '協力者',
    acquaintance: '知人',
    unknown: '不明',
  },
} as const;
