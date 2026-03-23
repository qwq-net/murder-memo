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

## 開発原則

- **場当たり修正禁止**: 編集や改修を行う時は、文脈と周辺処理をしっかりと整理してから着手する
- **コンポーネント化・共通化**: 再利用可能なロジックやスタイルは積極的に抽出する（ヘルパー関数、CSS 変数、共通定数）
- **メンテナンス性**: 将来の変更が容易な構造を意識する。影響範囲を確認してから修正する
- **ロジック分離**: UI に埋め込まず `src/lib/` に分離し、テスト可能にする

## テスト

- **フレームワーク**: Vitest (`npm run test`)
- **テストファイル**: `src/*/__tests__/*.test.ts` に配置
- **独立したロジック**（`src/lib/` のユーティリティ等）にはテストを作成する
- テストのメンテナンスを怠らない — 機能追加・変更時に関連テストも更新する

## データ構造とバックアップ

- `src/types/memo.ts` の `MurderMemoExport` 型でセッション全データをエクスポート可能
- `src/lib/exportImport.ts` にマイグレーション基盤あり（`migrations` レコードでバージョン間変換）
- データ構造を変更する時は:
  1. `EXPORT_VERSION` をバンプし、`migrations[旧version]` を追加
  2. `validateExport` のバリデーションを更新
  3. IndexedDB スキーマ変更時は `DB_VERSION` バンプ + upgrade 関数追加
  4. エクスポート → インポートのラウンドトリップで動作確認

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
