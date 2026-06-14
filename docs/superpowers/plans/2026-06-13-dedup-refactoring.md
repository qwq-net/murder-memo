# 全体リファクタリング（重複・非効率コード解消）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ロジック・挙動を一切変えずに、重複コードの共通化と非効率な処理の改善を行う。

**Architecture:** 4エージェントによる事前調査で確定した約25件の指摘から、挙動変更リスクの低い18件を採用。共有ヘルパー（lib 純関数・common コンポーネント）を新設し、各利用箇所を置換する。Wave 1（タスク1〜4、ファイル素材が互いに素なので並列可）→ Wave 2（タスク5、横断的な定数置換）の2段階。

**Tech Stack:** React + TypeScript + Zustand(zundo) + Vitest。コメントは日本語。Prettier 規約（セミコロンあり・シングルクォート・100幅）。

**絶対制約（全タスク共通）:**

- 挙動・見た目・出力を1ビットも変えない（純粋なリファクタリング）
- CLAUDE.md のドメイン不変条件（楽観更新ロールバック、Undo/IDB 同期、カスケード削除、画像 blob GC、DnD 原子確定）を維持する
- `git commit` は実行しない（ユーザーが自分でコミットする）
- 各タスク完了時に `npm run test -- --run` と `npm run lint` を実行して全パスを確認する
- 既存テストの期待値は変更しない（変更が必要になった時点でそのリファクタは挙動を変えている疑いがある — 停止して報告）

---

## Wave 1（タスク1〜4 は互いにファイルが素・並列実行可）

### タスク1: store 楽観更新・並び替えの定型句を共通ヘルパーへ統合

**Files:**

- Modify: `src/lib/optimisticRollback.ts`（`runOptimisticUpdate` 追加）
- Create: `src/lib/sortOrder.ts`
- Create: `src/lib/__tests__/sortOrder.test.ts`
- Modify: `src/store/slices/entries.ts` / `characters.ts` / `memoGroups.ts` / `timelineGroups.ts` / `relations.ts`
- Test: 既存 `src/store/__tests__/` 一式 + 新規 sortOrder テスト

**背景（調査結果）:** 「`captureSessionRollback` → `set` → `try { await IDB } catch { rollback + addToast + console.error }`」が entries.ts:119-138, 155-193, 195-214, 216-235, 245-270, 333-342 / characters.ts:112-131 / memoGroups.ts:87-101 / timelineGroups.ts:80-94 の約9箇所で手書き反復。`maxOrder reduce` が7箇所（entries.ts:83, 164-166, 201-203, characters.ts:46, memoGroups.ts:43, timelineGroups.ts:42, relations.ts:45）。`reorderCharacters`（characters.ts:137-146）と `reorderTimelineGroups`（timelineGroups.ts:97-105）だけ「変化分のみ IDB 書き込み」最適化から取り残されている（memoGroups.ts:104-118 / reorderEntries は実装済み）。collapse トグルが memoGroups.ts:125-137 と timelineGroups.ts:112-124 で同型。

- [ ] **Step 1-1: sortOrder.ts のテストを先に書く**

`src/lib/__tests__/sortOrder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyReorder, bySortOrder, nextSortOrder } from '../sortOrder';

describe('nextSortOrder', () => {
  it('空配列なら 0 を返す（既存の reduce(-1)+1 と同値）', () => {
    expect(nextSortOrder([])).toBe(0);
  });
  it('最大 sortOrder + 1 を返す', () => {
    expect(nextSortOrder([{ sortOrder: 2 }, { sortOrder: 5 }, { sortOrder: 1 }])).toBe(6);
  });
});

describe('bySortOrder', () => {
  it('sortOrder 昇順に並ぶ', () => {
    const xs = [{ sortOrder: 3 }, { sortOrder: 1 }, { sortOrder: 2 }];
    expect([...xs].sort(bySortOrder).map((x) => x.sortOrder)).toEqual([1, 2, 3]);
  });
});

describe('applyReorder', () => {
  const items = [
    { id: 'a', sortOrder: 0 },
    { id: 'b', sortOrder: 1 },
    { id: 'c', sortOrder: 2 },
  ];
  it('orderedIds の位置で sortOrder を再採番し、変化分だけ changed に集める', () => {
    const { updated, changed } = applyReorder(items, ['c', 'a', 'b']);
    expect(updated.map((x) => x.id)).toEqual(['a', 'b', 'c']); // 位置は元のまま
    expect(updated.map((x) => x.sortOrder)).toEqual([1, 2, 0]);
    expect(changed.map((x) => x.id).sort()).toEqual(['a', 'b', 'c']);
  });
  it('orderedIds に無い要素と sortOrder が変わらない要素は同一参照のまま', () => {
    const { updated, changed } = applyReorder(items, ['a', 'b']);
    expect(updated[0]).toBe(items[0]);
    expect(updated[1]).toBe(items[1]);
    expect(updated[2]).toBe(items[2]);
    expect(changed).toEqual([]);
  });
});
```

- [ ] **Step 1-2: テストが失敗することを確認**

Run: `npm run test -- --run src/lib/__tests__/sortOrder.test.ts`
Expected: FAIL（モジュール未作成）

- [ ] **Step 1-3: `src/lib/sortOrder.ts` を実装**

```ts
/**
 * sortOrder（表示順）に関する共通ユーティリティ。
 * 各スライスで手書き反復していた「末尾追加の採番」「昇順比較」「並び替えの再採番」を集約する。
 */

/** sortOrder 昇順の比較関数 */
export const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }): number =>
  a.sortOrder - b.sortOrder;

/** 末尾追加用の次の sortOrder（空なら 0）。既存の reduce(..., -1) + 1 と同値 */
export function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return items.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1;
}

/**
 * orderedIds の並び位置で sortOrder を再採番する。
 * - orderedIds に含まれない要素・sortOrder が変わらない要素は同一参照のまま（changed に含めない）
 * - updated は元の配列位置を維持して返す（並べ替えは呼び手の責務。state へ反映する際の
 *   sort 有無がスライスごとに異なるため）
 */
export function applyReorder<T extends { id: string; sortOrder: number }>(
  items: readonly T[],
  orderedIds: readonly string[],
): { updated: T[]; changed: T[] } {
  const indexById = new Map(orderedIds.map((id, i) => [id, i]));
  const changed: T[] = [];
  const updated = items.map((item) => {
    const idx = indexById.get(item.id);
    if (idx === undefined || item.sortOrder === idx) return item;
    const next = { ...item, sortOrder: idx };
    changed.push(next);
    return next;
  });
  return { updated, changed };
}
```

- [ ] **Step 1-4: テストがパスすることを確認**

Run: `npm run test -- --run src/lib/__tests__/sortOrder.test.ts`
Expected: PASS

- [ ] **Step 1-5: `runOptimisticUpdate` を `src/lib/optimisticRollback.ts` に追加**

既存の `captureSessionRollback` の直後に追加（既存関数は変更しない）:

```ts
/**
 * 「楽観更新 → IDB 書き込み → 失敗時ロールバック + エラートースト + ログ」の定型句を集約する。
 *
 * 各スライスで手書き反復していた try/catch 構造を1箇所に閉じ込め、ロールバックの
 * 競合安全性（captureSessionRollback のセッション一致チェック）を新規アクションでも
 * 取りこぼさないようにする。snapshot は取得時の参照をそのまま書き戻すため Undo 履歴を汚さない。
 *
 * @returns 書き込み成功で true / 失敗（ロールバック実行済み）で false。
 *          成功時のみ追加処理を行うアクション（removeCharacter のフィルター掃除等）が分岐に使う。
 */
export async function runOptimisticUpdate<
  S extends {
    activeSessionId: string | null;
    addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  },
>(
  get: () => S,
  set: (fn: (s: S) => Partial<S>) => void,
  opts: {
    /** ロールバック時に書き戻すスナップショット（更新前の参照をそのまま渡す） */
    snapshot: Partial<S>;
    /** 楽観反映する set の中身 */
    apply: (s: S) => Partial<S>;
    /** IDB への永続化処理 */
    persist: () => Promise<unknown>;
    /** 失敗時のトースト文言（既存文言を一字一句維持して渡す） */
    errorMessage: string;
    /** console.error のラベル（既存ラベルを一字一句維持して渡す） */
    logLabel: string;
  },
): Promise<boolean> {
  const rollback = captureSessionRollback(get, set, opts.snapshot);
  set(opts.apply);
  try {
    await opts.persist();
    return true;
  } catch (err) {
    rollback();
    get().addToast(opts.errorMessage, 'error');
    console.error(`${opts.logLabel} の保存に失敗しました`, err);
    return false;
  }
}
```

**注意:** `ToastType` を `ui.ts` から import すると循環の恐れがあるためリテラル union で書く（`captureSessionRollback` が型引数で済ませているのと同方針）。既存の console.error 文言が「〜の保存に失敗しました」以外の箇所（削除系）があれば、`logLabel` ではなくメッセージ全文を受け取る形（`logMessage: string`）に変えて一字一句維持すること。**適用前に各箇所の実際の文言を確認し、出力が変わらない設計を選ぶ。**

- [ ] **Step 1-6: entries.ts の4アクションを置換**

`updateEntry` / `moveEntryToPanel` / `setEntryGroup` / `toggleCharacterTag` の `rollback 取得〜catch` を `runOptimisticUpdate` 呼び出しへ。例（updateEntry）:

```ts
updateEntry: async (id, patch) => {
  const sessionId = get().activeSessionId;
  if (!sessionId) return;
  const prev = get().entries;
  const entry = prev.find((e) => e.id === id);
  if (!entry) return;
  const updated = { ...entry, ...patch, updatedAt: Date.now() };
  // 楽観更新 → 失敗時は元の配列参照ごとロールバック＋エラートースト（runOptimisticUpdate に集約）
  await runOptimisticUpdate(get, set, {
    snapshot: { entries: prev },
    apply: (s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }),
    persist: () => putEntry(updated, sessionId),
    errorMessage: 'メモの保存に失敗しました',
    logLabel: 'updateEntry',
  });
},
```

同様に `reorderEntries` と `moveEntryAcrossContainers` の永続化部分も置換（後者は no-op early return・複数件 bulk 書き込み等の前段ロジックは**そのまま**、try/catch 部分のみ）。`addEntry` は再 throw + id 除去の特殊形なので**対象外（触らない）**。`maxOrder reduce`（164-166, 201-203, 83）は `nextSortOrder(prev.filter(...))` へ置換。

- [ ] **Step 1-7: characters / memoGroups / timelineGroups のカスケード削除を置換**

`removeCharacter`（characters.ts:112-131）は戻り値 `boolean` で成功時のみ `removeCharacterFromFilters` 相当の後続処理を実行する形に。`removeMemoGroup` / `removeTimelineGroup` も同様に置換。採番 reduce（characters.ts:46, memoGroups.ts:43, timelineGroups.ts:42, relations.ts:45）は `nextSortOrder` へ。**置換前後で各アクションの実行順序（set が persist より先）・トースト文言・console 出力が完全一致することを目視確認。**

- [ ] **Step 1-8: reorderCharacters / reorderTimelineGroups を変化分のみ書き込みへ**

`applyReorder` を使い、memoGroups.ts:104-118 と同じ「changed のみ `bulkPut*`、state は全件反映」構造に揃える。**各スライスの既存の順序意味論を維持すること**: reorderMemoGroups は「await bulkPut → set」、reorderEntries は「set → await（楽観 + ロールバック）」と構造が異なる。それぞれの既存構造の中で `applyReorder` を使うだけにし、await と set の順序・sort の有無を変えない。reorderMemoGroups / reorderEntries 自体も `applyReorder` で畳めるなら畳む（出力同値が条件）。

- [ ] **Step 1-9: collapse トグルの共通化**

`toggleMemoGroupCollapse` / `toggleTimelineGroupCollapse` の同型ロジックを `src/store/slices/` 内の小ヘルパー（または各スライスに残したまま `sortOrder.ts` とは別の共通関数）に抽出。「投げっぱなし `.catch(console.error 系)`・同期 set」の挙動を維持。無理に抽象化して読みにくくなるなら**現状維持でも可**（2箇所×10行の削減より可読性優先）。

- [ ] **Step 1-10: 検証**

Run: `npm run test -- --run` → 全パス / `npm run lint` → エラーなし
Expected: 既存テスト（entries / characters / groupRemoval / undoSync 等）の期待値変更ゼロでパス

---

### タスク2: lib/hooks の I/O 効率化 + 画像保存フロー共通化

**Files:**

- Modify: `src/lib/idb.ts`（wipeSessionStores, replaceSessionData）
- Modify: `src/lib/exportImport.ts`（estimateExportSize）
- Modify: `src/lib/textExport.ts`（buildCharMap の引き回し）
- Create: `src/lib/imagePersist.ts`
- Modify: `src/hooks/useImageDrop.ts` / `src/hooks/useClipboardPaste.ts`

**背景:** idb.ts:224-230 の entries 削除がループ内逐次 await（直後の他ストア 233-237 は並列化済みで非対称）。replaceSessionData:527-530 が7ストアを逐次処理（Undo/Redo のホットパス）。estimateExportSize:200-210 が画像を1件ずつ逐次 getImage。textExport.ts:66 がパネルごとに同じ charMap を再構築。useImageDrop.ts:25-73 と useClipboardPaste.ts:35-48 で「resize → putImage → エントリ追加 → 失敗時 deleteImage」が二重実装。

- [ ] **Step 2-1: wipeSessionStores の entries 削除を並列発行に**

```ts
const entries = await tx.objectStore('entries').index('by-session').getAll(sessionId);
const dels: Promise<unknown>[] = [];
for (const entry of entries) {
  dels.push(tx.objectStore('entries').delete(entry.id));
  if (deleteImages && entry.imageBlobKey) {
    dels.push(tx.objectStore('images').delete(entry.imageBlobKey));
  }
}
await Promise.all(dels);
```

単一トランザクションは維持（既存の他ストアと同じパターン）。

- [ ] **Step 2-2: replaceSessionData の削除フェーズ・書き戻しフェーズを各ストア並列に**

削除フェーズを `Promise.all(SESSION_STORES.map(async (store) => {...}))` 化。**「全削除 → 全書き戻し」の2フェーズ境界（フェーズ間 await）は必ず残す**。単一 readwrite トランザクションの不変条件を維持。

- [ ] **Step 2-3: estimateExportSize の画像取得を一括化**

blobKey を Set で重複排除してから `Promise.all` で取得。`exportSession` 側は base64 化のメモリピーク懸念があるため**触らない**。

- [ ] **Step 2-4: textExport の buildCharMap を formatSessionAsText で1回だけ構築**

`formatPanel` に Map を引数で渡す形へ。出力文字列は完全不変。

- [ ] **Step 2-5: `src/lib/imagePersist.ts` を新設して2フックを統合**

```ts
import { resizeImage } from './imageResize'; // 実際の import 元はフックの現状実装に合わせる
import { deleteImage, putImage } from './idb';
import { nanoid } from 'nanoid';

/**
 * 画像 blob をリサイズして IDB へ保存し、attach（エントリ追加等）まで行う。
 * attach が失敗した場合は保存済み blob を後始末して孤児化を防ぐ
 * （「画像 blob のライフサイクル（GC 方式）」の前段の契約。
 * useImageDrop / useClipboardPaste で二重実装されていたものを集約）。
 */
export async function persistResizedImage(
  blob: Blob,
  attach: (blobKey: string) => Promise<void>,
): Promise<boolean> {
  const resized = await resizeImage(blob);
  const blobKey = nanoid();
  await putImage(blobKey, resized);
  try {
    await attach(blobKey);
    return true;
  } catch {
    // エントリ追加に失敗したら保存済み blob を削除して孤児化を防ぐ（失敗は黙認）
    await deleteImage(blobKey).catch(() => {});
    return false;
  }
}
```

**注意:** 上記は参照実装。実際の resize 関数名・nanoid の使い方・トースト処理は両フックの現状コードを読んで合わせ、**フック側の UI 固有処理（タイムライングループ有無チェック、トースト文言、複数枚ループ）は一切動かさない**。useImageDrop の「リサイズ前のグループ有無チェック」は putImage より前に残す。

- [ ] **Step 2-6: 検証**

Run: `npm run test -- --run`（特に exportImport / importSession / undoSync）+ `npm run lint`
Expected: 全パス

---

### タスク3: モーダル・共通 UI 部品の統合

**Files:**

- Create: `src/components/common/modalHeader.tsx`
- Create: `src/components/common/modalEmptyMessage.tsx`
- Create: `src/components/common/colorDot.tsx`
- Modify: `src/components/common/sectionHeader.tsx`（divider prop）※実パスは settings 配下の場合あり、現物確認
- Modify: `src/components/deductions/deductionModal.tsx` / `deductionRowView.tsx`
- Modify: `src/components/relations/relationDiagramModal.tsx` / `relationListItemView.tsx`
- Modify: `src/components/links/linkListModal.tsx`
- Modify: `src/components/settings/settingsPanel.tsx` / `backupSection.tsx` / `sessionManagementSection.tsx` / `layoutEditor.tsx` / `panelOrderEditor.tsx` / `markerCard.tsx`
- Modify: `src/components/characters/characterSetupPanel.tsx` / `characterBadgeBar.tsx`
- Modify: `src/components/common/welcomeModal.tsx`
- Modify: `src/components/icons/index.tsx`（未使用 IconMemo の削除のみ）

**背景:** モーダルヘッダー（タイトル + 閉じるボタン）の同一 JSX が6ファイル（deductionModal:69-92, relationDiagramModal:21-69, linkListModal:48-71, settingsPanel:65-88, characterSetupPanel:120-145, welcomeModal:30-56）。空状態メッセージ div が3ファイル。色丸 span が5〜7箇所。PL/NPC 分割が `lib/characterSort.ts` の `splitCharactersByRole` / `sortCharactersByRole`（テスト済み）を使わずインライン再実装（deductionModal:58-65, characterSetupPanel:56-63, characterBadgeBar:89-98）。settings のセクション区切り div が6箇所。`IconMemo` は利用箇所ゼロのデッドコード。DeductionRow が `useStore((s) => s.deductions)` の広い購読。

- [ ] **Step 3-1: `ModalHeader` を新設**

```tsx
import type { ReactNode } from 'react';
import { X } from '../icons';

// モーダル共通のヘッダースタイル（毎レンダー再生成を避けるためモジュールスコープに固定）
const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px 10px',
  borderBottom: '1px solid var(--border-subtle)',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '0.04em',
};

/**
 * モーダル共通ヘッダー（タイトル + 右端の閉じるボタン）。
 * 6つのモーダルで同一 JSX が手書き反復されていたものを集約。
 * leading: タイトル左側の要素（WelcomeModal のロゴ等）/ extra: タイトルと閉じるの間（タブ切替等）
 */
export function ModalHeader({
  title,
  onClose,
  leading,
  extra,
  padding,
}: {
  title: ReactNode;
  onClose: () => void;
  leading?: ReactNode;
  extra?: ReactNode;
  padding?: string;
}) {
  return (
    <div style={padding ? { ...HEADER_STYLE, padding } : HEADER_STYLE}>
      {leading}
      <span style={TITLE_STYLE}>{title}</span>
      {extra}
      <button type="button" onClick={onClose} className="modal-close-btn" aria-label="閉じる">
        <X size={18} />
      </button>
    </div>
  );
}
```

**注意:** 上記は雛形。各モーダルの実 DOM（leading/extra の配置、X の import 元が lucide か icons/index か）を読んで、**置換前後の DOM 構造・スタイルが完全一致**するよう調整する。1モーダルずつ置換し、構造が合わないもの（welcomeModal のロゴ配置等）は無理に押し込まず対象から外して報告する。characterSetupPanel の padding 差（`14px 18px`）は `padding` prop で吸収。

- [ ] **Step 3-2: `ModalEmptyMessage` を新設して3箇所置換**

```tsx
import type { ReactNode } from 'react';

/** モーダル内の「データなし」中央寄せメッセージ（3モーダルで重複していた div を集約） */
export function ModalEmptyMessage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}
    >
      {children}
    </div>
  );
}
```

deductionModal:96-106 / relationDiagramModal:73-83 / linkListModal:75-90 を置換（link の補足テキストは children に含める）。

- [ ] **Step 3-3: `ColorDot` を新設して置換**

```tsx
/** キャラクター色やパネル色を示す小さな丸（多数箇所のインライン span を集約） */
export function ColorDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }}
    />
  );
}
```

deductionRowView:101-110 / relationListItemView:44-53, 67-77 / layoutEditor:190-202 / panelOrderEditor:44-57 / markerCard:128-137 で置換。**各箇所のサイズ・マージンが 8px 丸と完全一致する場合のみ**置換し、微差がある箇所はスキップして報告。

- [ ] **Step 3-4: characterSort.ts の再利用**

deductionModal:58-65 と characterSetupPanel:56-63 の `plChars/npcChars` useMemo を `splitCharactersByRole(characters)` へ、characterBadgeBar:89-98 の inline sort を `sortCharactersByRole` へ。**置換前に lib 関数の実装を読み、フィルタ条件・ソート規則が完全同値であることを確認**（同値でなければ置換しない）。

- [ ] **Step 3-5: SectionHeader に divider prop を追加して6箇所のラッパー div を削除**

`<div style={{ borderTop:'1px solid var(--border-subtle)', marginTop:6 }}>` ラッパーを `<SectionHeader divider>` に集約。

- [ ] **Step 3-6: DeductionRow の購読を絞る**

`useStore((s) => s.deductions)` → `useStore((s) => s.deductions.find((d) => d.characterId === characterId))`。find は毎回新参照を返さない（既存オブジェクト参照）ので Zustand の等価判定で安全。**該当行のみ再レンダーになることを確認。**

- [ ] **Step 3-7: 未使用 `IconMemo` をデッドコードとして削除**

`grep -rn "IconMemo" src/` で利用ゼロを確認してから `icons/index.tsx` から削除。他のインライン SVG の icons への集約は**今回スコープ外**（見た目差リスクのため別タスク）。

- [ ] **Step 3-8: 検証**

Run: `npm run test -- --run` + `npm run lint` + `npm run build`
Expected: 全パス。可能なら dev サーバーで各モーダルの見た目確認（最終レビューでも実施）

---

### タスク4: エントリ系 UI の重複解消

**Files:**

- Create: `src/lib/groupSelection.ts` + `src/lib/__tests__/groupSelection.test.ts`
- Modify: `src/components/entries/entryInput.tsx` / `groupSelector.tsx`
- Modify: `src/components/entries/textEntryView.tsx` / `imageEntryView.tsx`
- Create: `src/components/entries/imageThumbnailView.tsx`
- Modify: `src/components/entries/imageEntry.tsx`
- Modify: `src/components/entries/actions/menuItems.ts`
- Modify: `src/components/entries/dnd/entriesDndContext.tsx`
- Modify: `src/components/entries/entryCard.tsx`

**背景:** グループ候補解決（groups / validSelectedId / effectiveGroupId）が entryInput:50-60 と groupSelector:32-44 で重複。TextEntryView:49-57 が ImageEntryView:62-74 と同じバッジ計算を useMemo なしで実行。サムネイル JSX と `THUMB_HEIGHT = 40` が imageEntry:119-167 / imageEntryView:79-127 で二重定義。menuItems の移動サブメニューが同型クロージャ4回（138-171, 176-221）、表示形式サブメニューが同型ループ2回（386-412, 415-442）。entriesDndContext:41-43 が再レンダー毎に O(n) find。entryCard:50-52 がメニュー表示中毎レンダー filter。

- [ ] **Step 4-1: groupSelection のテストを先に書く**

`src/lib/__tests__/groupSelection.test.ts`（resolveGroupSelection の仕様: timeline は timelineGroups / メモパネルは memoGroupsForPanel / その他は空。selectedGroupId が候補に無ければ無効化。timeline かつグループ1件かつ未選択なら自動選択）。**先に entryInput.tsx:50-60 と groupSelector.tsx:32-44 の現物を読み、現挙動と完全同値の仕様でテストを書くこと。**

- [ ] **Step 4-2: `src/lib/groupSelection.ts` を実装してテストパス**

```ts
import type { MemoGroup, PanelId, TimelineGroup } from '../types/memo'; // 実際の型名・パスは現物に合わせる
import { memoGroupsForPanel } from './grouping'; // 実際の export 元に合わせる

/**
 * エントリ入力・グループ選択 UI のグループ候補と有効選択を解決する純関数。
 * entryInput と groupSelector で重複していた派生計算を集約
 * （片方だけ直して挙動が乖離する事故を防ぐ）。
 */
export function resolveGroupSelection(
  panel: PanelId,
  groups: { timelineGroups: TimelineGroup[]; memoGroups: MemoGroup[] },
  selectedGroupId: string,
): { candidates: Array<{ id: string; label: string }>; effectiveGroupId: string } {
  // 実装は現物の挙動に1:1で合わせる（候補の型は両コンポーネントの利用形に合わせて調整可）
}
```

- [ ] **Step 4-3: entryInput / groupSelector を resolveGroupSelection 利用へ置換**

両コンポーネントの useMemo 内で呼ぶだけにする。送信時挙動・表示が完全不変であること。

- [ ] **Step 4-4: バッジ計算の共通化と TextEntryView のメモ化**

`detectInlineCharacterIds → badgeCharacters → activeCharacterIds → hasEffectiveActive` の算出を純関数 `computeBadgeCharacters(entry, visibleCharacters, linkKeywords)` として `src/lib/characterBadges.ts` に切り出し、textEntryView と imageEntryView の両方から useMemo 経由で利用。**EntryContent（store 連携版）は触らない。**

- [ ] **Step 4-5: `ImageThumbnailView` を切り出し**

サムネ枠 JSX（img + プレースホルダ + THUMB_HEIGHT）を共通化し、imageEntry（編集モード）/ imageEntryView（閲覧モード）から利用。`THUMB_HEIGHT` の二重定義を解消。useImageBlob / Lightbox 制御は呼び出し側に残す。

- [ ] **Step 4-6: menuItems の移動・表示サブメニューをヘルパーで畳む**

`buildMoveSubmenu` 内にローカルヘルパー（`pushMoveItem(label, opts)`）を定義して4ブロックを集約。`buildDisplaySubmenu` の形式/モード2ループをジェネリックヘルパーに集約。**メニュー構造・ラベル・トースト文言・disabled 条件は完全不変**。`panelDefault!` の non-null assertion 周りは型が無理なく通る場合のみ統合（無理なら移動サブメニューのみで止める）。

- [ ] **Step 4-7: entriesDndContext / entryCard のメモ化**

```ts
// entriesDndContext.tsx:41-43
const activeEntry = useMemo(
  () => (activeId ? (useStore.getState().entries.find((e) => e.id === activeId) ?? null) : null),
  [activeId],
);
```

entryCard:50-52 も `useMemo` 化（空配列はモジュール定数に）。getState ベースで購読を増やさない方針を維持。

- [ ] **Step 4-8: 検証**

Run: `npm run test -- --run` + `npm run lint`
Expected: 全パス

---

## Wave 2（Wave 1 完了後に実行 — menuItems / textExport / appShell 等が Wave 1 と重なるため）

### タスク5: パネル別定数（色・ラベル）の一元化

**Files:**

- Create: `src/lib/panelMeta.ts`
- Modify: `src/components/entries/entryCardView.tsx:6-10` / `src/components/search/searchOverlay.tsx:14-24` / `src/components/search/searchResultItem.tsx:6-10` / `src/components/entries/actions/menuItems.ts:32-36` / `src/components/layout/panel.tsx:15-19` / `src/components/layout/mobileTabNav.tsx:8-18` / `src/components/layout/appShell.tsx:42` / `src/lib/textExport.ts:4` / `src/components/settings/panelConstants.ts` / `src/components/guide/previews/SearchOverlayPreview.tsx:12-22`

**背景:** `{ free: 'var(--panel-free-accent)', ... }` と `{ free: 'フリーメモ', personal: '自分用メモ', timeline: 'タイムライン' }` が6〜8ファイルに同一内容でコピーされている。正準版が `panelConstants.ts` にあるのに参照されていない。

- [ ] **Step 5-1: `src/lib/panelMeta.ts` を新設**

```ts
import type { PanelId } from '../types/memo';

/**
 * パネル別の表示メタ情報（アクセント色・日本語ラベル）の単一定義。
 * 6〜8ファイルに同一マップがコピーされていたものを集約する（色トークン変更時の追従漏れ防止）。
 */
export const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export const PANEL_LABEL: Record<PanelId, string> = {
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};
```

**注意:** 置換前に各ファイルのローカル定数の**値が完全一致**することを1箇所ずつ確認する（ラベル表記ゆれがあれば、その箇所は置換せず報告）。`panelConstants.ts` は settings/guide 向けの薄い re-export ラッパとして残すか、利用側を直接 `lib/panelMeta` 参照に書き換えるかは既存 import 数の少ない方を選ぶ。`entryCardView.tsx:54` の `?? 'var(--border-default)'` フォールバックは呼び出し側に残す。

- [ ] **Step 5-2: 10ファイルを順次置換**

1ファイルずつ置換し、都度 `npm run lint` の未使用 import エラーがないことを確認。

- [ ] **Step 5-3: 検証**

Run: `npm run test -- --run` + `npm run lint` + `npm run build`
Expected: 全パス

---

## 最終検証（全タスク完了後）

- [ ] `npm run test -- --run` 全パス
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] diff 全体レビュー（挙動変更が混入していないか、文言・スタイル値の変化がないか）
- [ ] コミットは行わない（ユーザーが実施）

## 採用を見送った指摘（挙動変更リスクあり・別タスク推奨）

記録のみ。今回のスコープでは実施しない:

1. **sessions.ts のレイアウト更新ロールバック統合** — captureSessionRollback 化するとセッション一致チェックが加わり挙動が変わる
2. **textExport の grouping.ts 統一** — 同時刻エントリの tie-break（現状: 挿入順 / grouping: sortOrder）が異なり出力が変わりうる
3. **useInlineEdit 共通フック化** — トースト分岐・blur/Enter 起点の差があり UX 退行リスク
4. **importSession の純関数分割** — 価値はあるが大規模。専用タスクとして別途実施推奨
5. **モーダルの早期 return（常時マウント解消）** — フォーカス復元への影響確認が必要
6. **キャラ色プリセット統一** — 自動色割当の順序が変わる（挙動変更）
7. **インライン SVG の icons/ 集約** — lucide との形状微差で見た目が変わりうる
8. **popover カードスタイルのトークン化** — 効果小・位置決めロジックと密結合
