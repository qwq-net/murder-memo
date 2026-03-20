// ─── Entry Types ────────────────────────────────────────────────────────────

export type MemoEntryType = 'text' | 'timeline' | 'character-info' | 'clue' | 'image';
export type PanelId = 'free' | 'personal' | 'timeline';

export interface MemoEntry {
  id: string;
  type: MemoEntryType;
  content: string;
  panel: PanelId;
  characterTags: string[]; // Character.id[]
  createdAt: number;
  updatedAt: number;
  sortOrder: number;

  // timeline用
  eventTime?: string; // 自由形式 "14:30", "1日目 午後" etc.
  eventTimeSortKey?: number; // ソート用数値キー

  // image用
  imageBlobKey?: string; // IndexedDB images store のキー

  // character-info用
  characterId?: string;

  // clue用
  importance?: 'low' | 'medium' | 'high';
}

// ─── Character ───────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  color: string; // hex "#e74c3c"
  shortcut?: string; // "1"–"9" キーボードショートカット
  sortOrder: number;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export interface PanelLayoutConfig {
  sizes: [number, number, number]; // パーセンテージ [40, 30, 30]
  order: [PanelId, PanelId, PanelId];
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export const EXPORT_VERSION = 1 as const;
export type ExportVersion = typeof EXPORT_VERSION;

export interface ExportedImage {
  blobKey: string; // MemoEntry.imageBlobKey と同値
  mimeType: string;
  base64: string;
}

export interface MurderMemoExport {
  version: ExportVersion;
  exportedAt: number;
  session: GameSession;
  entries: MemoEntry[];
  characters: Character[];
  images: ExportedImage[];
}
