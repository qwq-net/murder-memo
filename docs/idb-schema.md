# IndexedDB スキーマドキュメント

## 概要

| 項目 | 値 |
|------|-----|
| データベース名 | `murder-memo` |
| 現行バージョン | **3** |
| ライブラリ | [idb](https://github.com/nicedayfor/idb)（Promise ラッパー） |
| 定義ファイル | `src/lib/idb.ts` |

---

## オブジェクトストア一覧

| ストア名 | キーパス | インデックス | 導入バージョン |
|----------|---------|-------------|---------------|
| `entries` | `id` | `by-session` (`sessionId`), `by-panel` (`panel`) | v1 |
| `characters` | `id` | `by-session` (`sessionId`) | v1 |
| `sessions` | `id` | — | v1 |
| `images` | `key` | — | v1 |
| `timeline-groups` | `id` | `by-session` (`sessionId`) | v2 |
| `memo-groups` | `id` | `by-session` (`sessionId`) | v3 |

---

## ストア詳細

### `sessions`

セッション（ゲーム単位の最上位コンテナ）。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | nanoid。キーパス |
| `name` | `string` | セッション名（ユーザー編集可） |
| `createdAt` | `number` | 作成タイムスタンプ (ms) |
| `updatedAt` | `number` | 更新タイムスタンプ (ms) |
| `isDemo?` | `boolean` | デモセッションフラグ。省略時 `false` 扱い |

### `entries`

メモエントリ。全パネル共通のレコード。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | nanoid。キーパス |
| `sessionId` | `string` | 所属セッション（IDB 保存時に付与） |
| `type` | `'text' \| 'timeline' \| 'character-info' \| 'clue' \| 'image'` | エントリ種別 |
| `content` | `string` | テキスト内容 |
| `panel` | `'free' \| 'personal' \| 'timeline'` | 所属パネル |
| `characterTags` | `string[]` | 関連キャラクター ID 配列 |
| `createdAt` | `number` | 作成タイムスタンプ (ms) |
| `updatedAt` | `number` | 更新タイムスタンプ (ms) |
| `sortOrder` | `number` | パネル内の手動ソート順 |
| `timelineGroupId?` | `string` | タイムライングループ ID（`panel === 'timeline'` 時は必須） |
| `eventTime?` | `string` | `"HH:MM"` 形式。不明の場合は `undefined` |
| `eventTimeSortKey?` | `number` | `HH:MM` → 分換算 (`12:30` → `750`) |
| `imageBlobKey?` | `string` | `images` ストアのキー |
| `characterId?` | `string` | `character-info` 用キャラ ID |
| `importance?` | `'low' \| 'medium' \| 'high'` | `clue` 用の重要度 |
| `groupId?` | `string` | `memo-groups` ストアの ID（`free` / `personal` パネル用） |
| `characterDisplayFormat?` | `'full' \| 'badge' \| 'text'` | エントリ単位の表示形式オーバーライド |
| `characterDisplayVisibility?` | `'always' \| 'minimal' \| 'off'` | エントリ単位の表示切替オーバーライド |

**インデックス:**
- `by-session`: `sessionId` — セッション切替時の一括読み込み
- `by-panel`: `panel` — パネル別フィルタ

### `characters`

登場人物。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | nanoid。キーパス |
| `sessionId` | `string` | 所属セッション |
| `name` | `string` | キャラクター名 |
| `color` | `string` | テーマカラー（hex `"#e74c3c"`） |
| `sortOrder` | `number` | 表示順（= 行動順） |
| `role` | `'pl' \| 'npc'` | PL or NPC |
| `showInEntries` | `boolean` | エントリのキャラクターマーカーに表示するか |

### `timeline-groups`

タイムラインパネルのグループ（「当日」「前日」など）。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | nanoid。キーパス |
| `sessionId` | `string` | 所属セッション |
| `label` | `string` | グループ名（自由テキスト） |
| `sortOrder` | `number` | 表示順 |
| `collapsed` | `boolean` | 折りたたみ状態 |

### `memo-groups`

自由メモ / 個人メモのグループ。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | nanoid。キーパス |
| `sessionId` | `string` | 所属セッション |
| `panel` | `'free' \| 'personal'` | 所属パネル |
| `label` | `string` | グループ名 |
| `sortOrder` | `number` | 表示順 |
| `collapsed` | `boolean` | 折りたたみ状態 |

### `images`

画像 Blob ストレージ。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `key` | `string` | nanoid。キーパス（= `entries.imageBlobKey`） |
| `blob` | `Blob` | 画像バイナリデータ |

---

## エンティティ関連図

```
sessions (1)
  ├──< entries (N)       ... sessionId → sessions.id
  │     ├──? images (0..1)  ... imageBlobKey → images.key
  │     ├──? timeline-groups ... timelineGroupId → timeline-groups.id
  │     ├──? memo-groups     ... groupId → memo-groups.id
  │     └──* characters      ... characterTags[] → characters.id
  ├──< characters (N)    ... sessionId → sessions.id
  ├──< timeline-groups (N) ... sessionId → sessions.id
  └──< memo-groups (N)    ... sessionId → sessions.id
```

- `(1)` / `(N)`: 1対多
- `(0..1)`: 0または1
- `*`: 多対多（配列参照）
- `?`: optional

---

## マイグレーション履歴

### v1（初期）
- `entries` — メモエントリ（`by-session`, `by-panel` インデックス）
- `characters` — 登場人物（`by-session` インデックス）
- `sessions` — セッション管理
- `images` — 画像 Blob

### v2
- `timeline-groups` — タイムライングループ追加（`by-session` インデックス）

### v3
- `memo-groups` — 自由メモ / 個人メモのグループ追加（`by-session` インデックス）

---

## セッション削除時のカスケード

`deleteSession(id)` は1トランザクション内で以下を削除:
1. `entries` — 該当セッションの全エントリ + 紐づく `images`
2. `characters` — 該当セッションの全キャラクター
3. `timeline-groups` — 該当セッションの全タイムライングループ
4. `memo-groups` — 該当セッションの全メモグループ
5. `sessions` — セッション本体

`clearSessionData(id)` は 1〜4 のみ削除（セッション本体は残す）。
