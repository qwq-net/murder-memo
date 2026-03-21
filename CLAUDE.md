# CLAUDE.md — マダめもくん 開発ガイド

## ビルド & 開発

```bash
npm run dev        # 開発サーバー起動
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # ビルドプレビュー
```

## コードスタイル

- **Prettier**: セミコロンあり、シングルクォート、trailing comma: all、100文字幅
- **ESLint**: typescript-eslint strict + react-hooks + react-refresh
- **コメント**: すべて日本語で書く
- **import順序**: prettier-plugin-organize-imports が自動整理

## アーキテクチャ

### 状態管理（Zustand スライス）

`src/store/index.ts` に7つのスライスを結合:

| スライス | 責務 |
|---------|------|
| sessions | セッション CRUD、アクティブセッション管理 |
| entries | メモエントリの追加・更新・削除・並び替え |
| characters | キャラクター管理 |
| timeline-groups | タイムライングループ管理 |
| memo-groups | 自由メモ / 個人メモのグループ管理 |
| settings | アプリ設定（パネル順、表示形式等） |
| ui | モーダル表示状態、アクティブパネル |

セッション切替時に `subscribeWithSelector` で自動リロードされる。

### コンポーネント階層

```
App → SelectionProvider → AppShell
  ├── Header（セッション切替、登場人物設定、アプリ設定）
  ├── PanelContainer（デスクトップ）/ MobileTabNav（モバイル）
  │   ├── Panel → FreeMemoPanel → MemoPanel
  │   ├── Panel → PersonalMemoPanel → MemoPanel
  │   └── Panel → TimelinePanel
  ├── CharacterSetupPanel（モーダル）
  └── SettingsPanel（モーダル）
```

### カスタム Hooks（`src/hooks/`）

| フック | 用途 |
|-------|------|
| useCaretPosition | テキストカーソル位置の取得・復元 |
| useAutoResizeTextarea | textarea の高さ自動調整 |
| useEscapeKey | ESC キー監視 |
| useImageBlob | IndexedDB 画像ロード + URL 管理 |
| useLocalStorage | localStorage 永続化 |
| useResponsive | レスポンシブブレイクポイント判定 |
| useClipboardPaste | クリップボード画像ペースト検知 |

### 共通コンポーネント（`src/components/common/`）

- **ModalFrame**: モーダル共通フレーム（オーバーレイ + フォーカストラップ + ESC 閉じ）
- **ConfirmModal**: 確認ダイアログ（トグル確認付き）
- **ContextMenu**: 右クリックメニュー（サブメニュー + 安全三角形判定）
- **RadioGroup**: セグメントコントロール
- **EmptyState**: 空状態表示

### アイコン（`src/components/icons/`）

SVG アイコンは `icons/index.tsx` に集約。`size` と `className` props で制御。

## スタイリング規約

### デザイントークン

`src/index.css` の `:root` に CSS 変数として定義。`@theme` ブロックで Tailwind ユーティリティにもマッピング済み。

- Surface: `--bg-base` 〜 `--bg-active`（6段階）
- Border: `--border-subtle` / `--border-default` / `--border-strong`
- Text: `--text-primary` / `--text-secondary` / `--text-muted` / `--text-faint`
- Accent: `--accent`（琥珀）, `--panel-*-accent`（パネル別）

### ユーティリティクラス

- `btn-ghost` + `btn-sm` / `btn-md` / `btn-lg` — ゴーストボタン
- `btn-primary` — アクセント色塗りボタン
- `btn-danger` — 危険アクションボタン
- `input-base` — 標準入力フィールド
- `modal-overlay` — モーダルオーバーレイ
- `sr-only` — スクリーンリーダー専用

### 注意事項

- ヘッダーのボタン（登場人物設定・アプリ設定）は `rgba(255,255,255,0.15)` の半透明ボーダーを使用しており、`btn-ghost` の対象外
- 動的な色（ランタイムで変わる値）は `style` 属性を使用
- `color-mix()` は可読性を優先して `style` 属性で記述

## パフォーマンス注意点

- `useMemo` でフィルタ・ソート結果をキャッシュする（AppShell のキャラクターフィルタリング等）
- リストアイテムは `React.memo` でラップする（SortableEntryCard）
- `useStore(s => s.entries)` のような広いセレクタは避ける。必要なときだけ `useStore.getState()` で取得
- Vite の `manualChunks` で react / dndkit を分離済み

## データ永続化

IndexedDB（`murder-memo` データベース、スキーマバージョン 3）:

| ストア | インデックス |
|-------|------------|
| entries | by-session, by-panel |
| characters | by-session |
| timeline-groups | by-session |
| memo-groups | by-session |
| sessions | — |
| images | — |

## デプロイ

Cloudflare Pages + Workers。`wrangler.jsonc` で設定。
ビルド出力 `dist/` を `env.ASSETS` として配信。
