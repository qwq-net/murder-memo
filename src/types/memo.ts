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

  // timeline用 — panel === 'timeline' 時は timelineGroupId 必須
  timelineGroupId?: string; // TimelineGroup.id
  eventTime?: string; // "HH:MM" 形式のみ。未明の場合は undefined
  eventTimeSortKey?: number; // HH:MM → 分換算 (12:30 → 750)

  // image用
  imageBlobKey?: string; // IndexedDB images store のキー

  // character-info用
  characterId?: string;

  // clue用
  importance?: 'low' | 'medium' | 'high';
}

// ─── Timeline Group ─────────────────────────────────────────────────────────

export interface TimelineGroup {
  id: string;
  sessionId: string;
  label: string; // "当日", "前日", "7月15日" 等の自由テキスト
  sortOrder: number; // 手動ソート
  collapsed: boolean;
}

// ─── Character ───────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  color: string; // hex "#e74c3c"
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
  timelineGroups: TimelineGroup[];
  images: ExportedImage[];
}
