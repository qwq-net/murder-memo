// ─── Entry Types ────────────────────────────────────────────────────────────

export type MemoEntryType = 'text' | 'timeline' | 'character-info' | 'clue' | 'image';
export type PanelId = 'free' | 'personal' | 'timeline';
export type CharacterDisplayFormat = 'full' | 'badge' | 'text';
export type CharacterDisplayVisibility = 'always' | 'minimal' | 'off';

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
  eventTime?: string; // "HH:MM" 形式のみ。不明の場合は undefined
  eventTimeSortKey?: number; // HH:MM → 分換算 (12:30 → 750)

  // image用
  imageBlobKey?: string; // IndexedDB images store のキー

  // character-info用
  characterId?: string;

  // clue用
  importance?: 'low' | 'medium' | 'high';

  // free / personal グループ用（任意）
  groupId?: string; // MemoGroup.id

  // 関連人物マーカー表示設定（未設定 = アプリ設定のデフォルトに従う）
  characterDisplayFormat?: CharacterDisplayFormat;
  characterDisplayVisibility?: CharacterDisplayVisibility;

}

// ─── Memo Group (自由メモ / 自分用メモ) ─────────────────────────────────────

export interface MemoGroup {
  id: string;
  sessionId: string;
  panel: 'free' | 'personal';
  label: string;
  sortOrder: number;
  collapsed: boolean;
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

export type CharacterRole = 'pl' | 'npc';

export interface Character {
  id: string;
  name: string;
  color: string; // hex "#e74c3c"
  sortOrder: number; // DnDで並び替えた順 = 行動順
  role: CharacterRole; // PL or NPC
  showInEntries: boolean; // エントリのマーカーに表示するか
}

// ─── Relation（相関図） ──────────────────────────────────────────────────────

export interface CharacterRelation {
  id: string;
  sessionId: string;
  fromCharacterId: string;
  toCharacterId: string;
  label: string;
  color?: string;
  memo?: string;
  sortOrder: number;
}

// ─── Deduction（推理メモ / 犯人投票） ────────────────────────────────────────

export interface CharacterDeduction {
  id: string;
  sessionId: string;
  characterId: string;
  suspicionLevel: 0 | 1 | 2 | 3;
  memo: string;
  updatedAt: number;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDemo?: boolean; // デモセッションフラグ
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
  memoGroups: MemoGroup[];
  images: ExportedImage[];
  deductions?: CharacterDeduction[];
  relations?: CharacterRelation[];
}
