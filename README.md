# マダめもくん

マーダーミステリー・TRPG 向けの調査メモ Web アプリ。
セッション中に自由メモ・個人メモ・タイムラインを 3 パネルで同時管理できる。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 19 + TypeScript 5.9 |
| ビルド | Vite 7 |
| スタイリング | Tailwind CSS 4 + CSS カスタムプロパティ |
| 状態管理 | Zustand 5（スライスパターン） |
| データ永続化 | IndexedDB（idb ライブラリ） |
| ドラッグ&ドロップ | @dnd-kit |
| アニメーション | Motion |
| デプロイ | Cloudflare Pages + Workers |

## セットアップ

```bash
npm install
npm run dev
```

## ビルド & デプロイ

```bash
npm run build      # TypeScript 型チェック + Vite ビルド → dist/
npm run preview    # ビルド結果のプレビュー
```

Cloudflare Pages へのデプロイは `wrangler` 経由で行う。

## プロジェクト構成

```
src/
├── components/
│   ├── layout/        # AppShell, Panel, PanelContainer, ResizeHandle, MobileTabNav
│   ├── panels/        # FreeMemoPanel, PersonalMemoPanel, TimelinePanel, MemoPanel, MemoGroupSection
│   ├── entries/       # EntryCard, EntryInput, TextEntry, TimelineEntry, ImageEntry, SortableEntryList
│   │   └── actions/   # EntryContextMenu, BulkContextMenu, menu-items
│   ├── characters/    # CharacterSetupPanel, CharacterBadge, CharacterBadgeBar, CharacterColorPalette
│   ├── settings/      # SettingsPanel
│   ├── common/        # ContextMenu, ConfirmModal, ModalFrame, EmptyState, RadioGroup
│   └── icons/         # SVG アイコンコンポーネント
├── hooks/             # useCaretPosition, useEscapeKey, useImageBlob, useLocalStorage,
│                      # useResponsive, useAutoResizeTextarea, useClipboardPaste
├── store/
│   ├── index.ts       # Zustand ストア（subscribeWithSelector）
│   └── slices/        # sessions, entries, characters, timeline-groups, memo-groups, settings, ui
├── lib/
│   ├── idb.ts         # IndexedDB スキーマ & CRUD 操作
│   └── time-parser.ts # 時刻パース・オートコンプリート
├── types/
│   └── memo.ts        # 型定義（MemoEntry, Character, GameSession 等）
└── index.css          # デザイントークン + Tailwind テーマ + ユーティリティ
```

## データ構造

```
GameSession
├── MemoEntry[]          # 全メモエントリ（テキスト / タイムライン / 画像 / 手がかり）
├── Character[]          # 登場人物（PL / NPC）
├── TimelineGroup[]      # タイムライン用グループ（「当日」「前日」等）
└── MemoGroup[]          # 自由メモ / 個人メモ用グループ
```

すべて IndexedDB に永続化される。セッション単位でデータを分離管理。
