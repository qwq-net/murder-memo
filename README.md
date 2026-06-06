# マダめもくん

マーダーミステリー・TRPG 向けの調査メモ Web アプリ。
セッション中に自由メモ・個人メモ・タイムラインを 3 パネルで同時管理できる。

## 技術スタック

| カテゴリ          | 技術                                    |
| ----------------- | --------------------------------------- |
| フレームワーク    | React 19 + TypeScript 5.9               |
| ビルド            | Vite 7                                  |
| スタイリング      | Tailwind CSS 4 + CSS カスタムプロパティ |
| 状態管理          | Zustand 5（スライスパターン）           |
| データ永続化      | IndexedDB（idb ライブラリ）             |
| ドラッグ&ドロップ | @dnd-kit                                |
| アニメーション    | Motion                                  |
| デプロイ          | Cloudflare Pages + Workers              |

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
├── hooks/             # useCaretPosition, useImageDrop, useClipboardPaste, useUndoRedo,
│                      # useEntryDraft, useResponsive, useLocalStorage など
├── store/
│   ├── index.ts       # Zustand ストア（subscribeWithSelector + zundo）
│   └── slices/        # sessions, entries, characters, timeline-groups, memo-groups,
│                      # deductions, relations, link-keywords, settings, ui
├── lib/
│   ├── idb.ts         # IndexedDB スキーマ & CRUD 操作
│   ├── exportImport.ts # エクスポート/インポート + マイグレーション
│   ├── parseCharacterText.ts # キャラ名・リンクワードのインライン検出
│   ├── timeParser.ts  # 時刻パース・オートコンプリート・整合化
│   └── undoSync.ts    # Undo/Redo 後の IndexedDB 同期
├── types/
│   └── memo.ts        # 型定義（MemoEntry, Character, GameSession 等）
└── index.css          # デザイントークン + Tailwind テーマ + ユーティリティ
```

## データ構造

```
GameSession
├── MemoEntry[]          # 全メモエントリ（テキスト / タイムライン / 画像）
├── Character[]          # 登場人物（PL / NPC）
├── TimelineGroup[]      # タイムライン用グループ（「当日」「前日」等）
├── MemoGroup[]          # 自由メモ / 個人メモ用グループ
├── CharacterDeduction[] # 人物推理メモ（疑惑度・犯人投票）
├── CharacterRelation[]  # 相関図の関係線
└── LinkKeyword[]        # リンクキーワード辞書（`[ワード]` 自動リンク化）
```

すべて IndexedDB に永続化される（画像 blob は別ストア）。セッション単位でデータを分離管理。
