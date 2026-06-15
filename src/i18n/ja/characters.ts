/** characters 名前空間：登場人物設定パネルおよびキャラクターバッジ関連の文言 */
export const characters = {
  /** モーダルタイトル */
  heading: '登場人物',
  /** ヘッダーのサブテキスト */
  reorderHint: 'ドラッグで行動順を変更',
  /** タブラベル */
  tabs: {
    pl: 'プレイヤー（{n}）',
    npc: 'NPC（{n}）',
    typeList: 'キャラクタータイプ',
  },
  /** 空状態メッセージ */
  empty: {
    pl: 'プレイヤーを追加してください',
    npc: 'NPCを追加してください',
  },
  /** 追加フォーム */
  add: {
    placeholderPl: 'プレイヤー名を入力',
    placeholderNpc: 'NPC名を入力',
    nameLabel: '登場人物の名前',
  },
  /** トースト */
  toasts: {
    added: '登場人物を追加しました',
    removed: '登場人物を削除しました',
  },
  /** 行アクション */
  row: {
    dragHandle: 'ドラッグして並び替え',
    changeColor: 'テーマカラーを変更',
    nameLabel: '登場人物の名前',
    showLabel: '表示',
    hideLabel: '非表示',
    removeLabel: '{name}を削除',
  },
  /** カラーパレット */
  palette: {
    custom: 'カスタムカラー',
  },
  /** バッジのaria-label */
  badge: {
    tag: '{name}をタグ付け',
    untag: '{name}のタグを外す',
    filterOn: '{name}でフィルター',
    filterOff: '{name}のフィルターを解除',
  },
  /** フィルターバー */
  filter: {
    clearLabel: 'フィルターをクリア',
    clearTitle: 'フィルターをクリア',
  },
} as const;
