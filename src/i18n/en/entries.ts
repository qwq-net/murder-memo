import type { Messages } from '@/lib/i18n';

export const entries: Messages['entries'] = {
  /** 入力欄 */
  input: {
    /** 通常パネルのプレースホルダ */
    placeholder: 'Enter a memo… (Shift+Enter for new line)',
    /** タイムライングループが未作成のときのプレースホルダ */
    placeholderDisabled: 'Add a memo group first',
    /** 時刻入力の aria-label */
    timeLabel: 'Time',
    /** 時刻の形式エラー（スクリーンリーダー用） */
    timeError: 'Invalid time format',
    /** 本文の空エラー（スクリーンリーダー用） */
    textError: 'Please enter text',
    /** 画像追加ボタンの title */
    addImage: 'Add image',
    /** メモ追加成功トースト */
    added: 'Memo added',
  },
  /** グループセレクタ */
  group: {
    /** グループが 0 件のときの select プレースホルダ */
    none: 'No memo groups',
    /** グループ選択を促す select プレースホルダ */
    selectPrompt: 'Select a memo group…',
    /** グループ追加ボタンのラベル */
    add: 'Memo group',
    /** グループ追加ボタンの title */
    addTitle: 'Add memo group',
    /** select の aria-label */
    selectLabel: 'Destination memo group',
    /** グループ名入力の aria-label */
    nameLabel: 'Memo group name',
    /** グループ名入力のプレースホルダ（タイムライン） */
    namePlaceholderTimeline: 'Day of, Day before, etc.',
    /** グループ名入力のプレースホルダ（メモパネル） */
    namePlaceholderMemo: 'Memo group name',
    /** グループ追加成功トースト */
    added: 'Group added',
  },
  /** 重要度フィルターバー */
  importance: {
    /** グループの aria-label */
    filterGroupLabel: 'Filter by importance',
    /** 絞り込みクリアボタン */
    clearFilter: 'Clear importance filter',
    /** 高 */
    high: 'High',
    /** 中 */
    medium: 'Medium',
    /** 低 */
    low: 'Low',
    /** フィルターボタンの aria-label（絞り込み） */
    filterOn: 'Filter by importance: {label}',
    /** フィルターボタンの aria-label（解除） */
    filterOff: 'Remove importance filter: {label}',
    /** フィルターボタンの title */
    levelTitle: 'Importance: {label}',
  },
  /** エントリコンテンツ */
  content: {
    /** 本文が空の場合の表示 */
    empty: 'Empty memo',
  },
  /** 画像エントリ */
  image: {
    /** キャプション入力プレースホルダ（編集モード） */
    captionPlaceholder: 'Enter caption',
    /** キャプション未入力の閲覧モード表示 */
    captionEmpty: 'Enter caption',
  },
};
