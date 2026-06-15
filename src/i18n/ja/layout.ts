/** layout/ コンポーネント（AppShell・LayoutPopover・MobileTabNav 等）で使うラベル。 */
export const layout = {
  /** ローディング中の案内文 */
  loading: 'データを準備しています…',
  /** フッターの著作権表記 */
  footer: '© 2026 マダめもくん',
  /** セッション名自動生成のプレフィクス（日付文字列と結合する） */
  sessionNamePrefix: 'セッション ',
  /** セッション名自動生成時の重複連番パターン（正規表現の前半部分）用プレフィクス */
  sessionNameDupPrefix: 'セッション ',
  /** セッション切替セレクトの aria-label */
  sessionSwitch: 'セッション切替',
  /** セッション名変更ボタンのタイトル */
  renameSession: 'セッション名を変更',
  /** 新しいセッション作成ボタンのタイトル */
  newSession: '新しいセッション',
  /** デモセッションの案内メッセージ */
  demoBanner: 'こちらから新しいセッションを作成！',
  /** ヘッダーボタン: 使い方ガイド */
  guide: '使い方',
  guideTitle: '使い方ガイドを別タブで開く',
  /** ヘッダーボタン: 検索 */
  search: '検索',
  /** ヘッダーボタン: リンク一覧 */
  linkList: 'リンク一覧',
  /** ヘッダーボタン: 人物推理メモ */
  deductions: '人物推理メモ',
  deductionsAria: '人物推理メモを開く',
  /** ヘッダーボタン: 相関図 */
  relations: '相関図',
  relationsAria: '相関図を開く',
  /** ヘッダーボタン: 登場人物設定 */
  characters: '登場人物設定',
  charactersAria: '登場人物設定を開く',
  /** ヘッダーボタン: レイアウト */
  layoutBtn: 'レイアウト',
  layoutBtnTitle: 'レイアウトを編集',
  /** ヘッダーボタン: アプリ設定（settings.title を再利用するため空文字） */
  settingsBtn: 'アプリ設定',
  /** グループ全開ボタン */
  expandAll: 'すべて開く',
  expandAllAria: 'すべてのグループを開く',
  /** グループ全閉ボタン */
  collapseAll: 'すべて閉じる',
  collapseAllAria: 'すべてのグループを閉じる',
  /** セッション作成トースト */
  sessionCreated: 'セッションを作成しました',
  sessionCreateFailed: 'セッションの作成に失敗しました',
  /** モバイルタブナビの aria-label */
  mobileTabNav: 'パネル切替',
  /** モバイルタブの短縮ラベル */
  tab: {
    free: 'フリーメモ',
    personal: '自分用',
    timeline: 'タイムライン',
  },
  /** レイアウトポップオーバー */
  popover: {
    /** ポップオーバーダイアログの aria-label */
    dialogLabel: 'このセッションのレイアウト',
    /** ポップオーバーの見出し */
    heading: 'このセッションのレイアウト',
    /** 見出し下の注記 */
    note: 'この設定は現在のセッションにのみ適用されます',
    /** グローバル設定へ戻すボタンのラベル */
    resetToGlobal: 'グローバル設定に戻す',
  },
} as const;
