import type { Messages } from '@/lib/i18n';

export const settings: Messages['settings'] = {
  title: 'Settings',
  general: 'General',
  language: 'Language',
  theme: 'Theme',
  inputPosition: 'Input position',
  themeAuto: 'Auto',
  themeDark: 'Dark',
  themeLight: 'Light',
  inputTop: 'Top',
  inputBottom: 'Bottom',
  layout: 'Layout',
  layoutHint: 'Used as the default for new sessions',
  markers: 'Character markers (default)',
  // セクションヘッダー
  textExport: 'Text Export',
  backup: 'Backup',
  currentSession: 'Current Session',
  fullReset: 'Full Reset',
  // テキストエクスポート
  textExportDescription: 'Copy memo contents to clipboard as Markdown text.',
  allPanels: 'All panels',
  // バックアップ説明
  backupDescription:
    'Export the current session data as a JSON file, or import and restore from a file.',
  // 統計
  memoCount: { one: '{n} memo', other: '{n} memos' },
  imageCount: { one: '{n} image', other: '{n} images' },
  characterCount: { one: '{n} character', other: '{n} characters' },
  // 大量画像警告
  manyImagesWarning:
    'This session has {n} images. The export file may be large, and importing it could risk data corruption.',
  // ボタン
  exportButton: 'Export',
  importButton: 'Import',
  // エクスポート確認モーダル
  exportLargeTitle: 'Export file will be large',
  exportLargeImageInfo:
    'Contains {n} images (estimated {size}).\nThe file is large and export may take some time.',
  doExport: 'Export',
  // セッション管理
  clearSessionDescription:
    'Delete all memos, characters, memo groups, and image data. The session itself will remain.',
  clearSessionButton: 'Clear session',
  demoClearDisabled: 'Sample scenarios cannot be cleared',
  deleteSessionDescription: 'Delete the session and all its data.',
  deleteSessionButton: 'Delete session',
  demoDeleteDisabled: 'Sample scenarios cannot be deleted',
  lastSessionDisabled: 'The last session cannot be deleted',
  fullResetDescription:
    'Delete all sessions, settings, and saved data, and return the app to its initial state.',
  fullResetButton: 'Full reset',
  // 確認モーダル
  clearConfirmTitle: 'Clear the current session?',
  clearConfirmLabel: 'I understand that all memos, characters, and image data will be deleted',
  clearConfirmAction: 'Clear',
  deleteConfirmTitle: 'Delete the current session?',
  deleteConfirmLabel: 'I understand that the session and all its data will be permanently deleted',
  deleteConfirmAction: 'Delete',
  resetAllConfirmTitle: 'Fully reset the app?',
  resetAllConfirmLabel:
    'I understand that all sessions, memos, characters, settings, and image data will be permanently deleted',
  resetAllConfirmAction: 'Full reset',
  // トースト
  backupDownloaded: 'Backup downloaded',
  exportFailed: 'Export failed',
  importFailed: 'Import failed',
  noMemoToExport: 'No memos to export',
  copiedToClipboard: 'Copied to clipboard',
  copyFailed: 'Copy failed',
  sessionCleared: 'Session cleared',
  sessionDeleted: 'Session deleted',
  sessionImported: '{name} imported',
  // レイアウトエディタ
  layoutStructure: 'Structure',
  layoutPanelVisibility: 'Panel visibility',
  layoutPanelOrder: 'Order',
  // 構造プリセットラベル
  structureColumns1: '1 column',
  structureColumns2: '2 columns',
  structureColumns3: '3 columns',
  structureStackLeft: 'Split left',
  structureStackRight: 'Split right',
  structureStacked: '2 rows',
  // パネル表示/非表示トグル
  panelHideTooltip: 'Hide',
  panelShowTooltip: 'Show',
  panelLastVisibleTooltip: 'Cannot hide the last panel',
  // パネル並び順エディタ aria-label
  panelMoveUp: 'Move up',
  panelMoveDown: 'Move down',
  // マーカーカード
  markerFormat: 'Format',
  markerMode: 'Mode',
  markerFormatFull: 'Full',
  markerFormatBadge: 'Badge',
  markerFormatText: 'Text',
  markerVisibilityAlways: 'Always',
  markerVisibilityMinimal: 'Minimal',
  markerVisibilityOff: 'Off',
  markerVisibilityOffPreview: 'Hidden',
  markerVisibilityMinimalHint: 'Show all on hover / edit',
  // デモキャラクター名（MarkerPreview 用）
  mockDoctor: 'Doctor',
  mockButler: 'Butler',
  mockLady: 'Lady',
  mockDetective: 'Detective',
  mockGardener: 'Gardener',
};
