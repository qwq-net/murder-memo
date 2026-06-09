import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import type {
  Character,
  CharacterDeduction,
  CharacterRelation,
  GameSession,
  LinkKeyword,
  MemoEntry,
  MemoGroup,
  TimelineGroup,
} from '@/types/memo';

// ─── スキーマ ────────────────────────────────────────────────────────────────

interface MurderMemoDB extends DBSchema {
  entries: {
    key: string;
    value: MemoEntry;
    indexes: {
      'by-session': string;
      'by-panel': string;
    };
  };
  characters: {
    key: string;
    value: Character & { sessionId: string };
    indexes: { 'by-session': string };
  };
  'timeline-groups': {
    key: string;
    value: TimelineGroup;
    indexes: { 'by-session': string };
  };
  'memo-groups': {
    key: string;
    value: MemoGroup;
    indexes: { 'by-session': string };
  };
  deductions: {
    key: string;
    value: CharacterDeduction;
    indexes: { 'by-session': string };
  };
  relations: {
    key: string;
    value: CharacterRelation;
    indexes: { 'by-session': string };
  };
  'link-keywords': {
    key: string;
    value: LinkKeyword & { sessionId: string };
    indexes: { 'by-session': string };
  };
  sessions: {
    key: string;
    value: GameSession;
  };
  images: {
    key: string; // blobKey (nanoid)
    value: {
      key: string;
      blob: Blob;
    };
  };
}

const DB_NAME = 'murder-memo';
const DB_VERSION = 6;

let dbPromise: Promise<IDBPDatabase<MurderMemoDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<MurderMemoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MurderMemoDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // エントリ
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('by-session', 'sessionId');
          entriesStore.createIndex('by-panel', 'panel');

          // キャラクター
          const charsStore = db.createObjectStore('characters', { keyPath: 'id' });
          charsStore.createIndex('by-session', 'sessionId');

          // セッション
          db.createObjectStore('sessions', { keyPath: 'id' });

          // 画像 (Blob)
          db.createObjectStore('images', { keyPath: 'key' });
        }

        if (oldVersion < 2) {
          // タイムライングループ
          const groupsStore = db.createObjectStore('timeline-groups', { keyPath: 'id' });
          groupsStore.createIndex('by-session', 'sessionId');
        }

        if (oldVersion < 3) {
          // memo-groups (自由メモ / 自分用メモ)
          const memoGroupsStore = db.createObjectStore('memo-groups', { keyPath: 'id' });
          memoGroupsStore.createIndex('by-session', 'sessionId');
        }

        if (oldVersion < 4) {
          // 推理メモ（犯人投票）
          const deductionsStore = db.createObjectStore('deductions', { keyPath: 'id' });
          deductionsStore.createIndex('by-session', 'sessionId');
        }

        if (oldVersion < 5) {
          // 相関図
          const relationsStore = db.createObjectStore('relations', { keyPath: 'id' });
          relationsStore.createIndex('by-session', 'sessionId');
        }

        if (oldVersion < 6) {
          // リンクキーワード辞書（自動リンク化対象ワード）
          const linkKeywordsStore = db.createObjectStore('link-keywords', { keyPath: 'id' });
          linkKeywordsStore.createIndex('by-session', 'sessionId');
        }
      },
    });
  }
  return dbPromise;
}

// ─── セッション ──────────────────────────────────────────────────────────────

export async function getAllSessions(): Promise<GameSession[]> {
  const db = await getDb();
  return db.getAll('sessions');
}

export async function putSession(session: GameSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

/**
 * セッションと、それに紐づく全データを単一トランザクションで削除する。
 *
 * 対象: sessions レコード本体 + by-session を持つ全ストア（entries / characters /
 * timeline-groups / memo-groups / deductions / relations / link-keywords）+
 * エントリが参照する images。
 * 単一トランザクションのため途中で失敗すれば全体がロールバックされ、部分削除は残らない。
 * セッション枠を残して中身だけ空にしたい場合は clearSessionData を使う。
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [
      'sessions',
      'entries',
      'characters',
      'timeline-groups',
      'memo-groups',
      'deductions',
      'relations',
      'link-keywords',
      'images',
    ],
    'readwrite',
  );

  // セッションに紐づくエントリ・キャラクター・タイムライングループ・画像を一括削除
  const entries = await tx.objectStore('entries').index('by-session').getAll(id);
  for (const entry of entries) {
    await tx.objectStore('entries').delete(entry.id);
    if (entry.imageBlobKey) {
      await tx.objectStore('images').delete(entry.imageBlobKey);
    }
  }

  const chars = await tx.objectStore('characters').index('by-session').getAll(id);
  for (const char of chars) {
    await tx.objectStore('characters').delete(char.id);
  }

  const groups = await tx.objectStore('timeline-groups').index('by-session').getAll(id);
  for (const group of groups) {
    await tx.objectStore('timeline-groups').delete(group.id);
  }

  const memoGroups = await tx.objectStore('memo-groups').index('by-session').getAll(id);
  for (const mg of memoGroups) {
    await tx.objectStore('memo-groups').delete(mg.id);
  }

  const deductions = await tx.objectStore('deductions').index('by-session').getAll(id);
  for (const d of deductions) {
    await tx.objectStore('deductions').delete(d.id);
  }

  const relations = await tx.objectStore('relations').index('by-session').getAll(id);
  for (const r of relations) {
    await tx.objectStore('relations').delete(r.id);
  }

  const linkKeywords = await tx.objectStore('link-keywords').index('by-session').getAll(id);
  for (const kw of linkKeywords) {
    await tx.objectStore('link-keywords').delete(kw.id);
  }

  await tx.objectStore('sessions').delete(id);
  await tx.done;
}

/**
 * セッション配下のデータを単一トランザクションで全削除する。
 * deleteSession との違いは sessions レコード本体を残す点（セッション枠は維持し中身だけ空にする）。
 * 途中失敗時はトランザクションごとロールバックされる。
 *
 * keepImages=false（既定）: エントリが参照する画像 blob も併せて削除する（clearCurrentSession 用の完全クリア）。
 * keepImages=true: 画像 blob は削除せず温存する（Undo/Redo 同期 syncStateToIdb 用）。
 *   Undo 同期は entries を imageBlobKey ごと書き戻すが、画像 blob 本体はメモリに無く再書き込みできない。
 *   ここで消すと書き戻した imageBlobKey が参照先を失い、画像が全滅する。よって温存する
 *   （巻き戻しで参照されなくなった blob は孤児として残るが、セッション削除時にまとめて掃除される）。
 */
export async function clearSessionData(id: string, keepImages = false): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    [
      'entries',
      'characters',
      'timeline-groups',
      'memo-groups',
      'deductions',
      'relations',
      'link-keywords',
      'images',
    ],
    'readwrite',
  );

  const entries = await tx.objectStore('entries').index('by-session').getAll(id);
  for (const entry of entries) {
    await tx.objectStore('entries').delete(entry.id);
    if (!keepImages && entry.imageBlobKey) {
      await tx.objectStore('images').delete(entry.imageBlobKey);
    }
  }

  const chars = await tx.objectStore('characters').index('by-session').getAll(id);
  for (const char of chars) {
    await tx.objectStore('characters').delete(char.id);
  }

  const groups = await tx.objectStore('timeline-groups').index('by-session').getAll(id);
  for (const group of groups) {
    await tx.objectStore('timeline-groups').delete(group.id);
  }

  const memoGroups = await tx.objectStore('memo-groups').index('by-session').getAll(id);
  for (const mg of memoGroups) {
    await tx.objectStore('memo-groups').delete(mg.id);
  }

  const deductions = await tx.objectStore('deductions').index('by-session').getAll(id);
  for (const d of deductions) {
    await tx.objectStore('deductions').delete(d.id);
  }

  const relations = await tx.objectStore('relations').index('by-session').getAll(id);
  for (const r of relations) {
    await tx.objectStore('relations').delete(r.id);
  }

  const linkKeywords = await tx.objectStore('link-keywords').index('by-session').getAll(id);
  for (const kw of linkKeywords) {
    await tx.objectStore('link-keywords').delete(kw.id);
  }

  await tx.done;
}

// ─── エントリ ────────────────────────────────────────────────────────────────

/**
 * セッションのエントリ一覧を返す。永続化用の内部フィールド sessionId は除去して返す
 * （characters / link-keywords と同様）。これを残すと型に無いフィールドがメモリ上の
 * MemoEntry に混入し、エクスポート JSON にも漏出するため剥がす。
 */
export async function getEntriesBySession(sessionId: string): Promise<MemoEntry[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('entries', 'by-session', sessionId);
  return rows.map((row) => {
    // 永続化時に付与した内部フィールド sessionId を剥がす（型 MemoEntry には無い）
    const { sessionId: _sid, ...e } = row as MemoEntry & { sessionId?: string };
    void _sid;
    return e as MemoEntry;
  });
}

export async function putEntry(entry: MemoEntry, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.put('entries', { ...entry, sessionId } as MemoEntry & { sessionId: string });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('entries', id);
}

export async function bulkPutEntries(entries: MemoEntry[], sessionId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('entries', 'readwrite');
  await Promise.all(
    entries.map((e) => tx.store.put({ ...e, sessionId } as MemoEntry & { sessionId: string })),
  );
  await tx.done;
}

// ─── キャラクター ────────────────────────────────────────────────────────────

/**
 * セッションのキャラクター一覧を返す。
 * 旧スキーマで role / showInEntries を持たないレコードには既定値（role: 'pl', showInEntries: true）を補う。
 * 永続化用の sessionId フィールドは除去して返す。
 */
export async function getCharactersBySession(sessionId: string): Promise<Character[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('characters', 'by-session', sessionId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return rows.map(({ sessionId, ...c }) => ({
    role: 'pl' as const,
    showInEntries: true,
    ...(c as Omit<Character, 'role' | 'showInEntries'> &
      Partial<Pick<Character, 'role' | 'showInEntries'>>),
  }));
}

export async function putCharacter(char: Character, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.put('characters', { ...char, sessionId });
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('characters', id);
}

export async function bulkPutCharacters(chars: Character[], sessionId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('characters', 'readwrite');
  await Promise.all(chars.map((c) => tx.store.put({ ...c, sessionId })));
  await tx.done;
}

// ─── タイムライングループ ────────────────────────────────────────────────────

export async function getTimelineGroupsBySession(sessionId: string): Promise<TimelineGroup[]> {
  const db = await getDb();
  return db.getAllFromIndex('timeline-groups', 'by-session', sessionId);
}

export async function putTimelineGroup(group: TimelineGroup): Promise<void> {
  const db = await getDb();
  await db.put('timeline-groups', group);
}

export async function deleteTimelineGroup(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('timeline-groups', id);
}

export async function bulkPutTimelineGroups(groups: TimelineGroup[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('timeline-groups', 'readwrite');
  await Promise.all(groups.map((g) => tx.store.put(g)));
  await tx.done;
}

// ─── メモグループ ───────────────────────────────────────────────────────────

export async function getMemoGroupsBySession(sessionId: string): Promise<MemoGroup[]> {
  const db = await getDb();
  return db.getAllFromIndex('memo-groups', 'by-session', sessionId);
}

export async function putMemoGroup(group: MemoGroup): Promise<void> {
  const db = await getDb();
  await db.put('memo-groups', group);
}

export async function deleteMemoGroup(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('memo-groups', id);
}

export async function bulkPutMemoGroups(groups: MemoGroup[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('memo-groups', 'readwrite');
  await Promise.all(groups.map((g) => tx.store.put(g)));
  await tx.done;
}

// ─── 画像 ───────────────────────────────────────────────────────────────────

export async function putImage(key: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put('images', { key, blob });
}

export async function getImage(key: string): Promise<Blob | undefined> {
  const db = await getDb();
  const row = await db.get('images', key);
  return row?.blob;
}

export async function deleteImage(key: string): Promise<void> {
  const db = await getDb();
  await db.delete('images', key);
}

// ─── 推理メモ ─────────────────────────────────────────────────────────────

export async function getDeductionsBySession(sessionId: string): Promise<CharacterDeduction[]> {
  const db = await getDb();
  return db.getAllFromIndex('deductions', 'by-session', sessionId);
}

export async function putDeduction(deduction: CharacterDeduction): Promise<void> {
  const db = await getDb();
  await db.put('deductions', deduction);
}

export async function deleteDeduction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('deductions', id);
}

export async function bulkPutDeductions(deductions: CharacterDeduction[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('deductions', 'readwrite');
  await Promise.all(deductions.map((d) => tx.store.put(d)));
  await tx.done;
}

// ─── 相関図 ───────────────────────────────────────────────────────────────

export async function getRelationsBySession(sessionId: string): Promise<CharacterRelation[]> {
  const db = await getDb();
  return db.getAllFromIndex('relations', 'by-session', sessionId);
}

export async function putRelation(relation: CharacterRelation): Promise<void> {
  const db = await getDb();
  await db.put('relations', relation);
}

export async function deleteRelation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('relations', id);
}

export async function bulkPutRelations(relations: CharacterRelation[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('relations', 'readwrite');
  await Promise.all(relations.map((r) => tx.store.put(r)));
  await tx.done;
}

// ─── リンクキーワード辞書 ─────────────────────────────────────────────────

export async function getLinkKeywordsBySession(sessionId: string): Promise<LinkKeyword[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('link-keywords', 'by-session', sessionId);
  // sessionId フィールドはアプリ層に露出させない
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return rows.map(({ sessionId, ...kw }) => kw);
}

export async function putLinkKeyword(keyword: LinkKeyword, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.put('link-keywords', { ...keyword, sessionId });
}

export async function deleteLinkKeyword(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('link-keywords', id);
}

export async function bulkPutLinkKeywords(
  keywords: LinkKeyword[],
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('link-keywords', 'readwrite');
  await Promise.all(keywords.map((kw) => tx.store.put({ ...kw, sessionId })));
  await tx.done;
}

// ─── トランザクション横断のアトミック操作 ───────────────────────────────────
//
// 「楽観 set 先行 → 独立トランザクションを逐次 await」方式は途中失敗でメモリと IDB が
// 恒久乖離する。データ整合性が要のアプリのため、複数ストアにまたがる更新・カスケード削除は
// ここに集約し「単一トランザクションで全部成功 or 全部ロールバック」を保証する。

/** {@link replaceSessionData} に渡すセッション配下データ一式（state の TrackedState + linkKeywords）。 */
export interface SessionReplacement {
  entries: MemoEntry[];
  characters: Character[];
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  deductions: CharacterDeduction[];
  relations: CharacterRelation[];
  linkKeywords: LinkKeyword[];
}

/** by-session を持つ（images 以外の）全ストア名。 */
const SESSION_STORES = [
  'entries',
  'characters',
  'timeline-groups',
  'memo-groups',
  'deductions',
  'relations',
  'link-keywords',
] as const;

/**
 * 対象セッション配下の 7 ストア（by-session を持つ全ストア。images を除く）を
 * 単一トランザクションで「総入れ替え」する。Undo/Redo 後の {@link syncStateToIdb} 専用。
 *
 * - 削除と書き戻しを 1 本の readwrite トランザクションで行うため、途中で失敗（QuotaExceeded・
 *   abort 等）すれば全体がロールバックされ、「一部ストアが空のまま確定」する事故が起きない。
 * - images は state に本体を持たず書き戻せないため一切触らない（keepImages=true 相当）。
 *   巻き戻しで参照されなくなった blob は孤児として残るが、{@link cleanupOrphanImages} や
 *   セッション削除でまとめて回収する。
 * - entries / characters / linkKeywords は内部フィールド sessionId を付与して保存する。
 *   timelineGroups / memoGroups / deductions / relations は要素が sessionId を保持しているため
 *   そのまま保存する。
 */
export async function replaceSessionData(
  data: SessionReplacement,
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(SESSION_STORES, 'readwrite');

  // 既存レコードを全削除（当該セッション分のみ）してから現在の state を書き戻す
  for (const store of SESSION_STORES) {
    const keys = await tx.objectStore(store).index('by-session').getAllKeys(sessionId);
    await Promise.all(keys.map((k) => tx.objectStore(store).delete(k)));
  }

  await Promise.all([
    ...data.entries.map((e) =>
      tx.objectStore('entries').put({ ...e, sessionId } as MemoEntry & { sessionId: string }),
    ),
    ...data.characters.map((c) => tx.objectStore('characters').put({ ...c, sessionId })),
    ...data.timelineGroups.map((g) => tx.objectStore('timeline-groups').put(g)),
    ...data.memoGroups.map((g) => tx.objectStore('memo-groups').put(g)),
    ...data.deductions.map((d) => tx.objectStore('deductions').put(d)),
    ...data.relations.map((r) => tx.objectStore('relations').put(r)),
    ...data.linkKeywords.map((kw) => tx.objectStore('link-keywords').put({ ...kw, sessionId })),
  ]);

  await tx.done;
}

/**
 * タイムライングループと所属エントリを単一トランザクションで削除する。
 * 画像 blob はハード削除せず GC（{@link cleanupOrphanImages}）に委ねる（Undo 復活のため）。
 */
export async function deleteTimelineGroupCascade(
  groupId: string,
  entryIds: string[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['entries', 'timeline-groups'], 'readwrite');
  await Promise.all(entryIds.map((id) => tx.objectStore('entries').delete(id)));
  await tx.objectStore('timeline-groups').delete(groupId);
  await tx.done;
}

/**
 * メモグループを削除し、所属エントリを未分類化（groupId クリア済みの更新版を put）する処理を
 * 単一トランザクションで行う。エントリ本体は残す（タイムライングループと対照的）。
 */
export async function reassignMemoGroupAndDelete(
  groupId: string,
  reassignedEntries: MemoEntry[],
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['entries', 'memo-groups'], 'readwrite');
  await Promise.all(
    reassignedEntries.map((e) =>
      tx.objectStore('entries').put({ ...e, sessionId } as MemoEntry & { sessionId: string }),
    ),
  );
  await tx.objectStore('memo-groups').delete(groupId);
  await tx.done;
}

/** {@link removeCharacterCascade} に渡す、キャラ削除に伴う連動更新の内訳。 */
export interface CharacterCascade {
  characterId: string;
  relationIds: string[];
  deductionId?: string;
  /** characterTags から当該キャラを除去済みのエントリ更新版 */
  entryUpdates: MemoEntry[];
}

/**
 * キャラクター削除と、それに連動する周辺データ（相関図・推理メモ・エントリの characterTags）の
 * 掃除を単一トランザクションで行う。途中失敗で「参照だけ残る中途半端な状態」を作らない。
 * キャラクターフィルタ（UI state）の掃除は永続層外なので呼び手側で別途行う。
 */
export async function removeCharacterCascade(
  cascade: CharacterCascade,
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['characters', 'relations', 'deductions', 'entries'], 'readwrite');
  await tx.objectStore('characters').delete(cascade.characterId);
  await Promise.all(cascade.relationIds.map((id) => tx.objectStore('relations').delete(id)));
  if (cascade.deductionId) await tx.objectStore('deductions').delete(cascade.deductionId);
  await Promise.all(
    cascade.entryUpdates.map((e) =>
      tx.objectStore('entries').put({ ...e, sessionId } as MemoEntry & { sessionId: string }),
    ),
  );
  await tx.done;
}

/**
 * どのエントリからも参照されていない画像 blob を回収する（孤児 blob 掃除）。
 *
 * Undo/Redo 同期（replaceSessionData は images を温存）やインポート途中失敗のロールバックで
 * 参照を失った blob が IDB に蓄積するのを防ぐ。entries 全件の imageBlobKey を参照集合とし、
 * images ストアのうち参照されないキーを削除する。戻り値は削除した blob 数。
 */
export async function cleanupOrphanImages(): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(['entries', 'images'], 'readwrite');
  const entries = await tx.objectStore('entries').getAll();
  const referenced = new Set<string>();
  for (const e of entries) {
    if (e.imageBlobKey) referenced.add(e.imageBlobKey);
  }
  const imageKeys = await tx.objectStore('images').getAllKeys();
  let removed = 0;
  await Promise.all(
    imageKeys.map((k) => {
      if (referenced.has(k as string)) return Promise.resolve();
      removed++;
      return tx.objectStore('images').delete(k);
    }),
  );
  await tx.done;
  return removed;
}

// ─── 完全リセット ─────────────────────────────────────────────────────────

/** IndexedDB データベースを完全に削除し、内部キャッシュをクリアする */
export async function destroyDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  const req = indexedDB.deleteDatabase(DB_NAME);
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    // 他タブ等が DB 接続を保持していると削除がブロックされる。ここで resolve しないと
    // Promise が永久にハングするため、警告を出して処理を進める（削除は接続解放後に完了する）。
    req.onblocked = () => {
      console.warn('データベース削除が他の接続にブロックされました（他タブを閉じると完了します）');
      resolve();
    };
  });
}
