/** エントリ入力・カード・グループセレクタ・画像エントリ周辺の文言（source of truth）。 */
export const entries = {
  /** 入力欄 */
  input: {
    /** 通常パネルのプレースホルダ */
    placeholder: 'メモを入力… (Shift+Enter で改行)',
    /** タイムライングループが未作成のときのプレースホルダ */
    placeholderDisabled: 'まずメモグループを追加してください',
    /** 時刻入力の aria-label */
    timeLabel: '時刻',
    /** 時刻の形式エラー（スクリーンリーダー用） */
    timeError: '時刻の形式が正しくありません',
    /** 本文の空エラー（スクリーンリーダー用） */
    textError: 'テキストを入力してください',
    /** 画像追加ボタンの title */
    addImage: '画像を追加',
    /** メモ追加成功トースト */
    added: 'メモを追加しました',
  },
  /** グループセレクタ */
  group: {
    /** グループが 0 件のときの select プレースホルダ */
    none: 'メモグループなし',
    /** グループ選択を促す select プレースホルダ */
    selectPrompt: 'メモグループを選択…',
    /** グループ追加ボタンのラベル */
    add: 'メモグループ',
    /** グループ追加ボタンの title */
    addTitle: 'メモグループを追加',
    /** select の aria-label */
    selectLabel: '追加先メモグループ',
    /** グループ名入力の aria-label */
    nameLabel: 'メモグループ名',
    /** グループ名入力のプレースホルダ（タイムライン） */
    namePlaceholderTimeline: '当日、前日 等',
    /** グループ名入力のプレースホルダ（メモパネル） */
    namePlaceholderMemo: 'メモグループ名',
    /** グループ追加成功トースト */
    added: 'グループを追加しました',
  },
  /** 重要度フィルターバー */
  importance: {
    /** グループの aria-label */
    filterGroupLabel: '重要度で絞り込み',
    /** 絞り込みクリアボタン */
    clearFilter: '重要度フィルターをクリア',
    /** 高 */
    high: '高',
    /** 中 */
    medium: '中',
    /** 低 */
    low: '低',
    /** フィルターボタンの aria-label（絞り込み） */
    filterOn: '重要度「{label}」で絞り込み',
    /** フィルターボタンの aria-label（解除） */
    filterOff: '重要度「{label}」の絞り込みを解除',
    /** フィルターボタンの title */
    levelTitle: '重要度「{label}」',
  },
  /** エントリコンテンツ */
  content: {
    /** 本文が空の場合の表示 */
    empty: '空のメモ',
  },
  /** 画像エントリ */
  image: {
    /** キャプション入力プレースホルダ（編集モード） */
    captionPlaceholder: 'キャプションを入力',
    /** キャプション未入力の閲覧モード表示 */
    captionEmpty: 'キャプションを入力',
  },
} as const;
