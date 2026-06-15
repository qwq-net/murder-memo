export const settings = {
  title: 'アプリ設定',
  general: '一般',
  language: '言語',
  theme: 'テーマ',
  inputPosition: '入力欄の位置',
  themeAuto: '自動',
  themeDark: 'ダーク',
  themeLight: 'ライト',
  inputTop: '上部',
  inputBottom: '下部',
  layout: 'レイアウト',
  layoutHint: '新しいセッションの初期値になります',
  markers: '関連人物マーカー（デフォルト）',
  // セクションヘッダー
  textExport: 'テキストエクスポート',
  backup: 'バックアップ',
  currentSession: '現在のセッション',
  fullReset: '完全リセット',
  // リセットボタン（SectionHeader の onReset 用）
  // ※ common.reset を共有
  // テキストエクスポート
  textExportDescription: 'メモ内容を Markdown テキストとしてクリップボードにコピーします。',
  allPanels: '全パネル',
  // バックアップ説明
  backupDescription:
    '現在のセッションのデータを JSON ファイルとしてエクスポート、またはファイルからインポートして復元します。',
  // 統計
  memoCount: { one: 'メモ {n} 件', other: 'メモ {n} 件' },
  imageCount: { one: '画像 {n} 件', other: '画像 {n} 件' },
  characterCount: { one: '登場人物 {n} 人', other: '登場人物 {n} 人' },
  // 大量画像警告
  manyImagesWarning:
    '画像が {n} 件あります。エクスポート時にファイルが大きくなったり、インポート時にデータが破損するおそれがあります。',
  // ボタン
  exportButton: 'エクスポート',
  importButton: 'インポート',
  // エクスポート確認モーダル
  exportLargeTitle: 'エクスポートファイルが大きくなります',
  exportLargeImageInfo: '画像 {n} 枚（推定 {size}）を含みます。\nファイルが大きいため、エクスポートに時間がかかる場合があります。',
  doExport: 'エクスポートする',
  // セッション管理
  clearSessionDescription:
    'すべてのメモ・登場人物・メモグループ・画像データを削除します。セッション自体は残ります。',
  clearSessionButton: '初期化する',
  demoClearDisabled: 'サンプルシナリオは初期化できません',
  deleteSessionDescription: 'セッションとそのデータをすべて削除します。',
  deleteSessionButton: 'セッションを削除',
  demoDeleteDisabled: 'サンプルシナリオは削除できません',
  lastSessionDisabled: '最後のセッションは削除できません',
  fullResetDescription:
    'すべてのセッション・設定・保存データを完全に削除し、アプリを初期状態に戻します。',
  fullResetButton: '完全リセット',
  // 確認モーダル
  clearConfirmTitle: '現在のセッションを初期化しますか？',
  clearConfirmLabel: 'すべてのメモ・登場人物・画像データが削除されることを理解しました',
  clearConfirmAction: '初期化する',
  deleteConfirmTitle: '現在のセッションを削除しますか？',
  deleteConfirmLabel: 'セッションとそのすべてのデータが完全に削除されることを理解しました',
  deleteConfirmAction: '削除する',
  resetAllConfirmTitle: 'アプリを完全にリセットしますか？',
  resetAllConfirmLabel:
    'すべてのセッション・メモ・登場人物・設定・画像データが完全に削除されることを理解しました',
  resetAllConfirmAction: '完全リセット',
  // トースト
  backupDownloaded: 'バックアップをダウンロードしました',
  exportFailed: 'エクスポートに失敗しました',
  importFailed: 'インポートに失敗しました',
  noMemoToExport: 'エクスポートするメモがありません',
  copiedToClipboard: 'クリップボードにコピーしました',
  copyFailed: 'コピーに失敗しました',
  sessionCleared: 'セッションを初期化しました',
  sessionDeleted: 'セッションを削除しました',
  sessionImported: '{name} をインポートしました',
  // レイアウトエディタ
  layoutStructure: '構造',
  layoutPanelVisibility: 'パネルの表示',
  layoutPanelOrder: '並び順',
  // 構造プリセットラベル
  structureColumns1: '1列',
  structureColumns2: '2列',
  structureColumns3: '3列',
  structureStackLeft: '左を上下分割',
  structureStackRight: '右を上下分割',
  structureStacked: '上下2段',
  // パネル表示/非表示トグル
  panelHideTooltip: '非表示にする',
  panelShowTooltip: '表示する',
  panelLastVisibleTooltip: '最後の1枚は非表示にできません',
  // パネル並び順エディタ aria-label
  panelMoveUp: '上に移動',
  panelMoveDown: '下に移動',
  // マーカーカード
  markerFormat: '形式',
  markerMode: 'モード',
  markerFormatFull: 'フル',
  markerFormatBadge: 'バッジ',
  markerFormatText: 'テキスト',
  markerVisibilityAlways: '常時',
  markerVisibilityMinimal: 'ミニマル',
  markerVisibilityOff: 'オフ',
  markerVisibilityOffPreview: '非表示',
  markerVisibilityMinimalHint: 'ホバー / 編集中に全表示',
  // マーカーカードのパネル別ラベル（panels.* を参照することを推奨するが、ここでは独立して定義）
  // ※ panels.free / panels.personal / panels.timeline を使う
  // デモキャラクター名（MarkerPreview 用）
  mockDoctor: '医者',
  mockButler: '執事',
  mockLady: '令嬢',
  mockDetective: '探偵',
  mockGardener: '庭師',
} as const;
