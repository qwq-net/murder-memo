import { nanoid } from 'nanoid';

import {
  bulkPutCharacters,
  bulkPutDeductions,
  bulkPutEntries,
  bulkPutLinkKeywords,
  bulkPutMemoGroups,
  bulkPutRelations,
  bulkPutTimelineGroups,
  deleteSession,
  getCharactersBySession,
  getDeductionsBySession,
  getEntriesBySession,
  getImage,
  getLinkKeywordsBySession,
  getMemoGroupsBySession,
  getRelationsBySession,
  getTimelineGroupsBySession,
  putImage,
  putSession,
} from '@/lib/idb';
import type { ExportedImage, GameSession, LinkKeyword, MurderMemoExport } from '@/types/memo';
import { EXPORT_VERSION } from '@/types/memo';

// ─── マイグレーション ────────────────────────────────────────────────────────
//
// バージョン N → N+1 への変換関数を登録する。
// 将来フィールドが増えたら migrate[N] を追加するだけで後方互換性を維持できる。
//
// 例: v2 で relations / deductions が追加された場合
//   migrations[1] = (data) => ({ ...data, relations: [], deductions: [], version: 2 })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MigrationFn = (data: any) => any;

const migrations: Record<number, MigrationFn> = {
  // v1 → v2: リンクキーワード辞書フィールドを追加
  1: (data) => ({ ...data, linkKeywords: [], version: 2 }),
};

/**
 * エクスポートデータを現行バージョンにマイグレーションする。
 * version が EXPORT_VERSION 以上（同値・未来版）なら変換せずそのまま返す。
 *
 * throw: 現行版に届くまでの途中バージョンに対応する変換関数が未登録の場合
 *        （例: v1→v2 はあるが v2→v3 が無いのに version=2 で EXPORT_VERSION=3）。
 *
 * （テスト容易性のため公開しているが、通常は `importSession` 経由で内部利用される）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateToLatest(data: any): MurderMemoExport {
  let current = data;
  while (current.version < EXPORT_VERSION) {
    const fn = migrations[current.version as number];
    if (!fn) {
      throw new Error(
        `マイグレーション v${current.version} → v${current.version + 1} が未定義です`,
      );
    }
    current = fn(current);
  }
  return current as MurderMemoExport;
}

// ─── バリデーション ──────────────────────────────────────────────────────────

/**
 * インポート対象データが MurderMemoExport の必須構造を満たすか判定する型ガード。
 *
 * true を返す条件: オブジェクトであること / version が 1〜EXPORT_VERSION の数値 /
 * exportedAt が数値 / session.id が文字列 /
 * entries・characters・timelineGroups・memoGroups・images がいずれも配列であること。
 *
 * - version > EXPORT_VERSION（未来版）は false（このアプリでは開けない）
 * - deductions・relations・linkKeywords は optional のため検証しない
 *   （これらを欠く旧バージョンのエクスポートも有効として受理する）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateExport(data: any): data is MurderMemoExport {
  if (data == null || typeof data !== 'object') return false;
  if (typeof data.version !== 'number' || data.version < 1 || data.version > EXPORT_VERSION)
    return false;
  if (typeof data.exportedAt !== 'number') return false;
  if (data.session == null || typeof data.session.id !== 'string') return false;
  if (!Array.isArray(data.entries)) return false;
  if (!Array.isArray(data.characters)) return false;
  if (!Array.isArray(data.timelineGroups)) return false;
  if (!Array.isArray(data.memoGroups)) return false;
  if (!Array.isArray(data.images)) return false;
  return true;
}

// ─── エクスポート ────────────────────────────────────────────────────────────

/** Blob を base64 文字列に変換 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // "data:image/png;base64,..." → base64 部分のみ
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** エクスポート前のサイズ推定。画像の合計バイト数を返す */
export async function estimateExportSize(
  sessionId: string,
): Promise<{ imageCount: number; totalBytes: number }> {
  const entries = await getEntriesBySession(sessionId);
  const seenKeys = new Set<string>();
  let totalBytes = 0;
  let imageCount = 0;

  for (const entry of entries) {
    if (entry.imageBlobKey && !seenKeys.has(entry.imageBlobKey)) {
      seenKeys.add(entry.imageBlobKey);
      const blob = await getImage(entry.imageBlobKey);
      if (blob) {
        imageCount++;
        // base64 化で約1.33倍 + JSON オーバーヘッド
        totalBytes += Math.ceil(blob.size * 1.34);
      }
    }
  }

  return { imageCount, totalBytes };
}

/** バイト数を人間が読みやすい文字列に変換 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 推定サイズが警告閾値を超えているか（50MB） */
export const EXPORT_WARN_BYTES = 50 * 1024 * 1024;

/** セッションの全データをエクスポート用オブジェクトに変換 */
export async function exportSession(session: GameSession): Promise<MurderMemoExport> {
  const [entries, characters, timelineGroups, memoGroups, deductions, relations, linkKeywords] =
    await Promise.all([
      getEntriesBySession(session.id),
      getCharactersBySession(session.id),
      getTimelineGroupsBySession(session.id),
      getMemoGroupsBySession(session.id),
      getDeductionsBySession(session.id),
      getRelationsBySession(session.id),
      getLinkKeywordsBySession(session.id),
    ]);

  // 画像の収集
  const images: ExportedImage[] = [];
  const seenKeys = new Set<string>();
  for (const entry of entries) {
    if (entry.imageBlobKey && !seenKeys.has(entry.imageBlobKey)) {
      seenKeys.add(entry.imageBlobKey);
      const blob = await getImage(entry.imageBlobKey);
      if (blob) {
        images.push({
          blobKey: entry.imageBlobKey,
          mimeType: blob.type || 'image/png',
          base64: await blobToBase64(blob),
        });
      }
    }
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    session,
    entries,
    characters,
    timelineGroups,
    memoGroups,
    images,
    deductions,
    relations,
    linkKeywords,
  };
}

/** JSON ファイルとしてダウンロード */
export function downloadJson(data: MurderMemoExport): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.session.name.replace(/[/\\?%*:|"<>]/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── インポート ──────────────────────────────────────────────────────────────

/** base64 文字列を Blob に変換 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * エクスポート JSON ファイルを読み込み、独立した新規セッションとして取り込む。
 *
 * - 元データの全 ID を新しい nanoid に振り直すため、元セッションと共存できる。
 *   参照（characterTags / timelineGroupId / groupId / characterId / imageBlobKey /
 *   相関図の from・to 等）も同じマップで新 ID に整合させて書き換える
 * - linkKeywords の id だけは外部参照されないため単純に新規発行する
 * - 旧バージョンのデータは migrateToLatest で現行版に変換してから取り込む
 * - throw: JSON 解析失敗 / validateExport 不合格 / 未定義マイグレーション / IDB 書き込み失敗
 * - IDB 書き込みが途中で失敗した場合は deleteSession で部分書き込みを巻き戻す
 *   （中途半端なセッションを残さない）。巻き戻し自体の失敗はログのみで握りつぶす
 * - 戻り値: 取り込んだ新セッション。アクティブ化はしないので呼び手側で切り替える
 */
export async function importSession(file: File): Promise<GameSession> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('JSON の解析に失敗しました');
  }

  if (!validateExport(raw)) {
    throw new Error('ファイル形式が不正です');
  }

  // マイグレーション（古いバージョンのデータを現行に変換）
  const data = migrateToLatest(raw);

  // ID リマッピング用のマップを構築
  const idMap = new Map<string, string>();
  const remap = (oldId: string): string => {
    let newId = idMap.get(oldId);
    if (!newId) {
      newId = nanoid();
      idMap.set(oldId, newId);
    }
    return newId;
  };

  // セッション
  const newSession: GameSession = {
    id: remap(data.session.id),
    name: data.session.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // キャラクター
  const newCharacters = data.characters.map((c) => ({
    ...c,
    id: remap(c.id),
  }));

  // タイムライングループ
  const newTimelineGroups = data.timelineGroups.map((g) => ({
    ...g,
    id: remap(g.id),
    sessionId: newSession.id,
  }));

  // メモグループ
  const newMemoGroups = data.memoGroups.map((g) => ({
    ...g,
    id: remap(g.id),
    sessionId: newSession.id,
  }));

  // エントリ（参照 ID を書き換え）
  const newEntries = data.entries.map((e) => ({
    ...e,
    id: remap(e.id),
    characterTags: e.characterTags.map((cid) => remap(cid)),
    timelineGroupId: e.timelineGroupId ? remap(e.timelineGroupId) : undefined,
    groupId: e.groupId ? remap(e.groupId) : undefined,
    characterId: e.characterId ? remap(e.characterId) : undefined,
    imageBlobKey: e.imageBlobKey ? remap(e.imageBlobKey) : undefined,
  }));

  // 推理メモ（optional — v1 エクスポートには含まれない場合がある）
  const newDeductions = (data.deductions ?? []).map((d) => ({
    ...d,
    id: remap(d.id),
    sessionId: newSession.id,
    characterId: remap(d.characterId),
  }));

  // 相関図（optional）
  const newRelations = (data.relations ?? []).map((r) => ({
    ...r,
    id: remap(r.id),
    sessionId: newSession.id,
    fromCharacterId: remap(r.fromCharacterId),
    toCharacterId: remap(r.toCharacterId),
  }));

  // リンクキーワード辞書（optional — v2 で追加）
  // id は外部から参照されないため、ID リマップではなく新規 nanoid 発行で十分
  const newLinkKeywords: LinkKeyword[] = (data.linkKeywords ?? []).map((kw) => ({
    id: nanoid(),
    keyword: kw.keyword,
    createdAt: kw.createdAt,
  }));

  // IDB に書き込み。
  // 途中で失敗した場合は `deleteSession` で部分書き込みを一括クリーンアップする
  // （壊れた中途半端なセッションが IDB に残らないようにするため）。
  try {
    await putSession(newSession);
    // 各 by-session ストアは独立しているため並列書き込みで安全に高速化できる
    await Promise.all([
      bulkPutCharacters(newCharacters, newSession.id),
      bulkPutTimelineGroups(newTimelineGroups),
      bulkPutMemoGroups(newMemoGroups),
      bulkPutEntries(newEntries, newSession.id),
      newDeductions.length > 0 ? bulkPutDeductions(newDeductions) : Promise.resolve(),
      newRelations.length > 0 ? bulkPutRelations(newRelations) : Promise.resolve(),
      newLinkKeywords.length > 0
        ? bulkPutLinkKeywords(newLinkKeywords, newSession.id)
        : Promise.resolve(),
    ]);

    // 画像の復元（並列で書き込み。画像は entries.imageBlobKey から参照される）
    await Promise.all(
      data.images.map(async (img) => {
        const newKey = idMap.get(img.blobKey);
        if (!newKey) return;
        const blob = base64ToBlob(img.base64, img.mimeType);
        await putImage(newKey, blob);
      }),
    );
  } catch (err) {
    // 部分書き込みをロールバック（deleteSession は対象セッションの全ストアを掃除する）
    try {
      await deleteSession(newSession.id);
    } catch (cleanupErr) {
      console.error('インポート失敗時のクリーンアップにも失敗しました', cleanupErr);
    }
    throw err instanceof Error ? err : new Error('インポートに失敗しました');
  }

  return newSession;
}
