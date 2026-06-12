// ─── Entry Types ────────────────────────────────────────────────────────────

export type MemoEntryType = 'text' | 'timeline' | 'clue' | 'image';
export type PanelId = 'free' | 'personal' | 'timeline';
export type ImportanceLevel = 'low' | 'medium' | 'high';
export type CharacterDisplayFormat = 'full' | 'badge' | 'text';
export type CharacterDisplayVisibility = 'always' | 'minimal' | 'off';

/**
 * メモエントリ。`type` と `panel` に応じて使用するフィールドが変わるが、型では union として
 * 表現せず optional フィールドの集合で持つ。以下の不変条件はコード（store / timeParser /
 * grouping）とテストで保証する暗黙の契約である:
 * - panel === 'timeline' のエントリは timelineGroupId を持つ（どの時間帯グループにも属さないと
 *   タイムライン表示に現れない）。タイムライン以外へ移すと timeline 系フィールドはクリアされる。
 * - eventTime と eventTimeSortKey は「両方設定 or 両方 undefined」で整合する（resolveEventTime 集約）。
 * - type === 'image' のエントリは imageBlobKey を持つ（IndexedDB images ストアのキー）。
 *   imageBlobKey は複数エントリで共有されうる（複製）。削除時のハード削除はせず GC で回収する。
 */
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

  // clue用
  importance?: ImportanceLevel;

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

// ─── Link Keyword（自動リンク化辞書） ───────────────────────────────────────

/**
 * セッション内で蓄積されるリンクキーワード辞書のエントリ。
 * `[テキスト]` 形式で確定したワードを自動登録し、以降のメモで `[]` なしでも
 * 自動的にリンク化（既存 search-link セグメントと同等）するための辞書。
 */
export interface LinkKeyword {
  id: string;
  keyword: string;
  createdAt: number;
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
  /** デモ作成時の APP_VERSION。バージョン不一致で自動差し替え */
  demoVersion?: string;
  /**
   * セッション固有のパネルレイアウト。未設定（undefined）ならグローバル設定
   * （settings.layout）に準拠する。セッション作成時にグローバルを複製して継承し、
   * 以降はセッション単位で独立して変更できる（解決規則は store/index.ts の
   * selectResolvedLayout を参照）。
   */
  layout?: PanelLayout;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * レイアウト構造プリセット（カラムツリーの形状分類）。
 * 保存はせず、形状から classifyStructure（lib/panelLayout.ts）で判定する派生情報。
 * - columns:     表示パネルを全て横並び（1〜3列）
 * - stack-left:  左カラム2段縦積み + 右1列（3枚表示時のみ）
 * - stack-right: 左1列 + 右カラム2段縦積み（3枚表示時のみ）
 * - stacked:     1カラム2段縦積み（2枚表示時のみ）
 */
export type LayoutStructure = 'columns' | 'stack-left' | 'stack-right' | 'stacked';

/** レイアウトの1カラム（縦1列）。panels が2要素なら上下2段の縦積み。 */
export interface LayoutColumn {
  /** カラム内のパネル（上から順、1〜2枚） */
  panels: PanelId[];
  /** カラム幅の比率（全カラム合計100に正規化して保存） */
  size: number;
  /** 2段縦積みのときのみ存在する上下の高さ比率（合計100） */
  rowSizes?: [number, number];
}

/**
 * パネルレイアウト（カラムツリー）。グローバル設定（settings.layout）と
 * セッション（GameSession.layout）の両層で持つ永続モデル。
 *
 * 不変条件（lib/panelLayout.ts の normalizeLayout とテストで保証）:
 * - 全 PanelId が columns 内 ∪ hidden にちょうど1回ずつ現れる
 * - columns は1〜3個、各 column.panels は1〜2個、表示パネルは必ず1枚以上
 * - 取りうるカラム形状は [1] [2] [1,1] [2,1] [1,2] [1,1,1] の6種
 */
export interface PanelLayout {
  /** 左から順のカラム列 */
  columns: LayoutColumn[];
  /** 非表示パネル */
  hidden: PanelId[];
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export const EXPORT_VERSION = 2 as const;
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
  linkKeywords?: LinkKeyword[];
}
