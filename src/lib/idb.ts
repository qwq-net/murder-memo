import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

import type { Character, GameSession, MemoEntry, MemoGroup, TimelineGroup } from '../types/memo';

// ─── Schema ──────────────────────────────────────────────────────────────────

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
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<MurderMemoDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<MurderMemoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MurderMemoDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // entries
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('by-session', 'sessionId');
          entriesStore.createIndex('by-panel', 'panel');

          // characters
          const charsStore = db.createObjectStore('characters', { keyPath: 'id' });
          charsStore.createIndex('by-session', 'sessionId');

          // sessions
          db.createObjectStore('sessions', { keyPath: 'id' });

          // images (Blob)
          db.createObjectStore('images', { keyPath: 'key' });
        }

        if (oldVersion < 2) {
          // timeline-groups
          const groupsStore = db.createObjectStore('timeline-groups', { keyPath: 'id' });
          groupsStore.createIndex('by-session', 'sessionId');
        }

        if (oldVersion < 3) {
          // memo-groups (自由メモ / 自分用メモ)
          const memoGroupsStore = db.createObjectStore('memo-groups', { keyPath: 'id' });
          memoGroupsStore.createIndex('by-session', 'sessionId');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getAllSessions(): Promise<GameSession[]> {
  const db = await getDb();
  return db.getAll('sessions');
}

export async function putSession(session: GameSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ['sessions', 'entries', 'characters', 'timeline-groups', 'memo-groups', 'images'],
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

  await tx.objectStore('sessions').delete(id);
  await tx.done;
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export async function getEntriesBySession(sessionId: string): Promise<MemoEntry[]> {
  const db = await getDb();
  // by-session インデックスはsessionIdフィールドを参照するが、
  // MemoEntry自体にsessionIdを持たせる形に変更（後述）
  const all = await db.getAll('entries');
  return all.filter((e) => (e as MemoEntry & { sessionId: string }).sessionId === sessionId);
}

export async function putEntry(entry: MemoEntry, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.put('entries', { ...entry, sessionId } as MemoEntry & { sessionId: string });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('entries', id);
}

export async function bulkPutEntries(
  entries: MemoEntry[],
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('entries', 'readwrite');
  await Promise.all(
    entries.map((e) => tx.store.put({ ...e, sessionId } as MemoEntry & { sessionId: string })),
  );
  await tx.done;
}

// ─── Characters ──────────────────────────────────────────────────────────────

export async function getCharactersBySession(sessionId: string): Promise<Character[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('characters', 'by-session', sessionId);
  return rows.map(({ sessionId: _sid, ...c }) => c as Character);
}

export async function putCharacter(char: Character, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.put('characters', { ...char, sessionId });
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('characters', id);
}

export async function bulkPutCharacters(
  chars: Character[],
  sessionId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('characters', 'readwrite');
  await Promise.all(chars.map((c) => tx.store.put({ ...c, sessionId })));
  await tx.done;
}

// ─── Timeline Groups ────────────────────────────────────────────────────────

export async function getTimelineGroupsBySession(
  sessionId: string,
): Promise<TimelineGroup[]> {
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

export async function bulkPutTimelineGroups(
  groups: TimelineGroup[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('timeline-groups', 'readwrite');
  await Promise.all(groups.map((g) => tx.store.put(g)));
  await tx.done;
}

// ─── Memo Groups ────────────────────────────────────────────────────────────

export async function getMemoGroupsBySession(
  sessionId: string,
): Promise<MemoGroup[]> {
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

// ─── Images ──────────────────────────────────────────────────────────────────

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
