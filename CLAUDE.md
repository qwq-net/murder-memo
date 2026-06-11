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

`src/store/index.ts` に10個のスライスを結合:

| スライス        | 責務                                                                 |
| --------------- | -------------------------------------------------------------------- |
| sessions        | セッション CRUD、アクティブセッション管理                            |
| entries         | メモエントリの追加・更新・削除・並び替え                             |
| characters      | キャラクター管理                                                     |
| timeline-groups | タイムライングループ管理                                             |
| memo-groups     | 自由メモ / 個人メモのグループ管理                                    |
| deductions      | 人物推理メモ（犯人投票・疑惑度）                                     |
| relations       | 相関図の関係線管理                                                   |
| link-keywords   | リンクキーワード辞書（`[ワード]` 自動リンク化対象）                  |
| settings        | アプリ設定（パネル順、表示形式等）                                   |
| ui              | モーダル表示状態、アクティブパネル、トースト、キャラクターフィルター |

セッション切替時に `subscribeWithSelector` で自動リロードされる。

Undo/Redo（`zundo`）は `entries / characters / timelineGroups / memoGroups / deductions / relations` のみを履歴対象（TrackedState）にする。`linkKeywords` や `ui` 等は履歴対象外。詳細は「データ永続化」の注意を参照。

### コンポーネント階層

```
App → SelectionProvider → AppShell
  ├── Header（セッション切替、登場人物設定、アプリ設定）
  ├── PanelContainer（デスクトップ）/ MobileTabNav（モバイル）
  │   ├── Panel → FreeMemoPanel → MemoPanel
  │   ├── Panel → PersonalMemoPanel → MemoPanel
  │   └── Panel → TimelinePanel
  ├── CharacterSetupPanel（モーダル）
  ├── DeductionModal（モーダル）
  ├── RelationDiagramModal（モーダル）
  └── SettingsPanel（モーダル）
```

#### エントリ DnD（コンテナ跨ぎ）

エントリのドラッグ&ドロップは `src/components/entries/dnd/` に3層で分離する:

- **EntriesDndContext**: `DndContext` + `DragOverlay` + sensors を持つ提供側。`closestCorners` で判定し、ドロップ確定を `planEntryMove`（純関数）に委ねて `moveEntryAcrossContainers` を呼ぶ。
- **SortableEntryColumn**: 1 コンテナ（メモグループ / タイムラインの時間帯・不明）を表す droppable な列。`useDroppable` で**空コンテナにも落とせる**。`DndContext` は持たない。
- **SortableEntryCard**: `useSortable` 対応カード（`React.memo`、Shift 複数選択と共存）。

スコープは **デスクトップ=全パネルを 1 つの EntriesDndContext で包む**（AppShell の PanelContainer をラップ）ことでカラム（パネル）間移動も成立させ、**モバイル=各パネルが自前で EntriesDndContext を張る**。この切替は `PanelDndBoundary`（`useInEntriesDnd` で親コンテキストの有無を見て二重生成を防ぐ）が担う。フィルター中のパネルは「表示が部分集合」になり sortOrder が壊れるため、列を `disabled` にしてドラッグ開始を抑止し、確定側でも移動元・移動先パネルのフィルターを再チェックして弾く。

### カスタム Hooks（`src/hooks/`）

| フック                      | 用途                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| useActiveSection            | IntersectionObserver による現在表示中セクションの判定（ガイド目次） |
| useAutoRegisterLinkKeywords | メモ確定時に `[ワード]` をリンク辞書へ自動登録                      |
| useAutoResizeTextarea       | textarea の高さ自動調整                                             |
| useCaretPosition            | テキストカーソル位置の取得（絶対オフセット）・復元                  |
| useClipboardPaste           | クリップボード画像ペースト検知（複数画像対応）                      |
| useDeleteWithConfirmation   | 確認ダイアログ付き削除ロジック                                      |
| useEntryDraft               | エントリの下書き状態管理（blur / Escape）                           |
| useEscapeKey                | ESC キー監視                                                        |
| useFilteredCharacters       | PL / NPC ロール別キャラクター分割                                   |
| useGroupLabelEditor         | グループラベル編集 + トースト                                       |
| useGroupSwap                | 隣接グループ入れ替え                                                |
| useImageBlob                | IndexedDB 画像ロード + Object URL 管理                              |
| useImageDrop                | 画像 D&D + ファイル選択（複数画像対応・孤児 blob 防止）             |
| useLocalStorage             | localStorage 永続化                                                 |
| useMenuContext              | メニューコンテキスト管理                                            |
| useResponsive               | レスポンシブブレイクポイント判定                                    |
| useSessionRenaming          | セッション名変更 UI 状態                                            |
| useTimeInput                | タイムライン時刻入力の状態管理（値・バリデーション・自動補完）      |
| useUndoRedo                 | Ctrl+Z / Ctrl+Shift+Z での Undo/Redo                                |

### 共通コンポーネント（`src/components/common/`）

- **ModalFrame**: モーダル共通フレーム（オーバーレイ + フォーカストラップ + ESC 閉じ）
- **ConfirmModal**: 確認ダイアログ（トグル確認付き）
- **ContextMenu**: 右クリックメニュー（サブメニュー + 安全三角形判定）
- **RadioGroup**: セグメントコントロール
- **EmptyState**: 空状態表示
- **GroupHeader**: グループ見出し（折りたたみ・ラベル編集・移動・削除）
- **ImageLightbox**: 画像拡大表示
- **ToastContainer**: トースト通知システム
- **WelcomeModal**: 初回 / バージョン変更時モーダル

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
- `modal-close-btn` — モーダル閉じるボタン
- `sr-only` — スクリーンリーダー専用

### 注意事項

- ヘッダーのボタンは `HeaderButton` コンポーネント（`src/components/layout/headerButton.tsx`）で統一。`btn-ghost` の対象外
- 動的な色（ランタイムで変わる値）は `style` 属性を使用
- `color-mix()` は可読性を優先して `style` 属性で記述
- クリック可能にする要素が空になりうる場合（時刻なしエントリの時刻列など）は、幅だけでなく最小高さ（または中身）を与える（理由: flex アイテムは中身が空だと交差サイズ＝高さが 0 に潰れ、幅があってもクリック判定が消える。実例: `timelineEntry.tsx` の時刻列 `minHeight`）

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

`importSession` は全 ID を新規採番し（元セッションと共存可）、書き込み途中で失敗したら `Promise.allSettled` 後に `deleteSession` で巻き戻す。`validateExport` は必須配列の要素の参照フィールドに加え、値域（`session.name` が文字列・`entry.panel` が既知 PanelId・`deduction.suspicionLevel` が 0〜3・`relation.label` が文字列・`linkKeyword.createdAt` が数値）も検証する。インポート時はエントリの `eventTime`/`eventTimeSortKey` を `resolveEventTime` で再正規化し（不正な時刻ペアを永続化しない）、自己参照の相関図（from === to）は取り込まない。**ダングリング参照は取り込まない**: `remap` は未知の旧 ID にも新 ID を発番してしまうため、参照フィールド（`timelineGroupId` / `groupId` / `characterTags` / 推理メモ・相関図のキャラ参照）は「エクスポート内に実体が存在する場合のみ remap、無ければ落とす」に統一する（実在しないグループを指す timeline エントリは `timelineGroupId` 未設定＝「未分類」に倒す）。panel と timeline 系フィールドの整合は `timelineFieldPatch` をアプリ内移動と共用する。`getEntriesBySession` は内部フィールド `sessionId` を剥がして返す（エクスポート JSON へ漏出させない）。

## ドメイン整合性ルール

挙動を変える時は次の不変条件を壊さないこと（各所の契約コメント・テストで保証）:

- **タイムライン時刻**: `eventTime` と `eventTimeSortKey` は「両方設定 or 両方 undefined」で必ず整合する。保存は `src/lib/timeParser.ts` の `resolveEventTime` に集約し、不正時刻（範囲外の `25:00` 等）は保存しない（entryInput / timelineEntry の両経路で経由）。
- **カスケード削除**: キャラクター削除（`removeCharacter`）は関連する相関図・推理メモ・エントリの `characterTags`・キャラクターフィルターからの参照も連動して掃除する。タイムライングループ削除は所属エントリごと削除、メモグループ削除は所属エントリを未分類化（エントリは残す）。これらのカスケード（characters / timeline / memo）は `src/lib/idb.ts` の単一トランザクションヘルパー（`removeCharacterCascade` / `deleteTimelineGroupCascade` / `reassignMemoGroupAndDelete`）に集約し、途中失敗で「参照だけ残る中途半端な状態」を作らない。ストア側は楽観更新し、失敗時は state を巻き戻してエラートーストを出す。
- **楽観更新のロールバック**: `set` を先行させる更新（`addEntry` / `updateEntry` / `moveEntryToPanel` / `moveEntryAcrossContainers` / `reclassify 相当` / `toggleCharacterTag` / `reorderEntries` とカスケード削除）は、IDB 書き込み失敗時に state を巻き戻す（参照ごと復元して Undo 履歴を汚さない）。`addEntry` は新規追加なので「追加分のみ id で除去」してから **再 throw** し、呼び手が後始末（画像 blob 削除等）できるようにする。ロールバックは `captureSessionRollback`（`src/lib/optimisticRollback.ts`）経由でスナップショット取得時とセッションが一致する場合のみ実行する。await 中にセッション切替が完了していた場合は巻き戻しを**放棄**する（切替リロードが新セッションの正しい状態を取得済みで、旧スナップショットで上書きすると表示が壊れる。失敗した書き込みは旧セッションの IDB に無いため、放棄しても次回ロードで整合する）。
- **コンテナ跨ぎ DnD の原子確定**: ドラッグ&ドロップによるエントリ移動は `moveEntryAcrossContainers`（entries スライス）に集約する。パネル・メモグループ・タイムライングループ・時刻（時間帯）の変更と、移動先パネル内の並び順（`orderedIds` による sortOrder 再採番）を **1 アクション**で原子的に確定する（`reorderEntries` / `setEntryGroup` / `moveEntryToPanel` を統合した上位版。後者は右クリックメニュー移動・既存テスト用に温存）。panel/timeline 系フィールドの整合（`panel==='timeline'` は `timelineGroupId`+`type:'timeline'`、timeline 以外は timeline 系フィールドをクリア）は `src/lib/entryPanelTransform.ts` の `timelineFieldPatch` に集約し `moveEntryToPanel` と共用する。ドロップ確定の組み立て（移動先コンテナ解決・挿入位置・時刻継承）は純関数 `src/lib/entryDnd.ts` の `planEntryMove`（補助: `resolveDropTarget` / `computeReorderedIds` / コンテナ id 規約）と `src/lib/timelineDrop.ts` の `resolveInheritedEventTime`（隣接エントリの時刻を継承、不明列はクリア、`resolveEventTime` 経由で整合）に分離してテスト可能にする。実質変化が無いドロップは `set` せず Undo 履歴・IDB 書き込みを発生させない。
- **タイムラインの孤児エントリの受け皿**: 通常の操作では `panel==='timeline'` のエントリは必ず実在する `timelineGroupId` を持つが、インポートデータや過去の不具合由来で「どのグループにも属さない孤児」が存在しうる。孤児は不可視にせず、タイムラインパネルとテキスト出力の **「未分類」**（`src/lib/grouping.ts` の `unassignedTimelineEntries`）に表示してユーザーが救出（DnD・右クリックでグループへ移動）できるようにする（メモパネルの未分類と同じ防御思想）。未分類列（`TIMELINE_UNASSIGNED_CONTAINER_ID`）はドラッグ**元**としてのみ機能し、ドロップ先にはならない（命名規約外 id + `dropDisabled` の二重ガードで、孤児を意図的に作る操作を許さない）。
- **画像 blob のライフサイクル（GC 方式）**: 画像 blob は state に本体を持たず `imageBlobKey` 参照のみ。エントリ/グループ/セッションの削除では blob を **ハード削除しない**（即削除すると Undo でエントリが復活したとき参照先を失う／複製で共有する blob を巻き添えにする）。参照されなくなった孤児 blob は、Undo 履歴が空で安全なアプリ初期化時（`initSessions`）に `cleanupOrphanImages` がまとめて回収する。`deleteSession`（セッションごと削除・非 Undo 対象）のみ即時に blob も削除する。`moveEntryToPanel` はパネル移動と所属グループ設定（timeline は `timelineGroupId` + `type:'timeline'`、メモは `groupId`）を 1 回の `putEntry` で原子的に確定する。

## パフォーマンス注意点

- `useMemo` でフィルタ・ソート結果をキャッシュする（AppShell のキャラクターフィルタリング等）
- リストアイテムは `React.memo` でラップする（SortableEntryCard）
- `useStore(s => s.entries)` のような広いセレクタは避ける。必要なときだけ `useStore.getState()` で取得
- Vite の `manualChunks` で react / dndkit を分離済み
- Undo/Redo は `zundo` ミドルウェアで実装。`useUndoRedo` フックがキーボード操作を処理

## データ永続化

IndexedDB（`murder-memo` データベース、スキーマバージョン 6）:

| ストア          | インデックス         |
| --------------- | -------------------- |
| entries         | by-session, by-panel |
| characters      | by-session           |
| timeline-groups | by-session           |
| memo-groups     | by-session           |
| deductions      | by-session           |
| relations       | by-session           |
| link-keywords   | by-session           |
| sessions        | —                    |
| images          | —                    |

### Undo/Redo と IDB 同期の不変条件（重要）

`zundo` はインメモリ状態のみ巻き戻す。永続層への反映は `src/lib/undoSync.ts` の `syncStateToIdb` が担い、`src/lib/idb.ts` の `replaceSessionData` に委譲する。`replaceSessionData` は対象セッション配下の 7 ストア（by-session を持つ全ストア。images を除く）の **削除と現 state の書き戻しを 1 本の readwrite トランザクション**で行うため、途中失敗（QuotaExceeded・abort 等）でも全体がロールバックされ「一部ストアが空のまま確定してデータ消失」する事故が起きない（旧実装は `clearSessionData` と各 `bulkPut` が別トランザクションで、`bulkPut` 失敗時にそのストアが空のまま残る恐れがあった）。失敗時は throw し、呼び手の `useUndoRedo` が catch してエラートーストで通知する（黙殺禁止）。ここで押さえるべき点:

1. **per-session で IDB 保存されるが TrackedState 外のスライス**（例: `linkKeywords`）は、セッション配下削除で消えるのに巻き戻し対象でないため、書き戻さないと Undo/Redo のたびに失われる。セッション配下ストアの一覧は `idb.ts` 冒頭の `SESSION_STORES` + `SESSION_STORE_META` に単一定義されており、`SessionReplacement` 型・削除/書き戻し処理はそこから導出される。
2. **state に本体を持たないバイナリ**（`images` の blob。state は `imageBlobKey` しか持たない）は書き戻せないため、`replaceSessionData` は images を一切触らない（旧 `keepImages: true` 相当）。巻き戻しで参照されなくなった blob は孤児として残るが、起動時の `cleanupOrphanImages` で回収する（「画像 blob のライフサイクル」参照）。

折りたたみ状態（`collapsed`）のような UI 寄りの変更で Undo 履歴が積まれないよう、`store/index.ts` の `equality` は `src/lib/historyEquality.ts` の `groupsEqualIgnoringCollapse` で collapsed を無視して比較する。

新しい per-session スライスを足すときは、`idb.ts` 冒頭の `SESSION_STORES` に追加する。`SESSION_STORE_META` → `SessionStateElement` → `SessionReplacement` →（`undoSync.ts` の書き戻しリテラル）の順に不足がコンパイルエラーで連鎖検出されるため、追加漏れは型レベルで防がれる。回帰テスト（`src/lib/__tests__/undoSync.test.ts`）の更新も忘れないこと。

## デプロイ

Cloudflare Pages + Workers。`wrangler.jsonc` で設定。
ビルド出力 `dist/` を `env.ASSETS` として配信。
