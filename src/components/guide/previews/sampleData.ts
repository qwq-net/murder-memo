import type { Character, CharacterRelation, LinkKeyword, MemoEntry } from '@/types/memo';

/**
 * Guide プレビュー全体で共有するサンプルデータ。
 *
 * 値は `src/lib/demoData.ts`（サンプルシナリオ）から借用し、Guide の各プレビューが
 * 「アプリ初回起動時に見えるもの」と同じ雰囲気で表示されるようにする。
 *
 * - キャラクター: PL 5 名 + NPC 2 名
 * - エントリ: タイムライン 2 件 / 自由メモ 2 件
 * - 関係線: 3 本（同居 / 対立 / 取引相手）
 * - リンクキーワード: `[密室]` `[ペーパーナイフ]` `[遺言書]` など
 *
 * id は Guide 用に固定の短い文字列（demoData のように nanoid を使わず、安定 SSR 出力を確保）。
 */

export const GUIDE_SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'pl-businessman',
    name: '実業家',
    color: '#e74c3c',
    sortOrder: 0,
    role: 'pl',
    showInEntries: true,
  },
  {
    id: 'pl-writer',
    name: '作家',
    color: '#3498db',
    sortOrder: 1,
    role: 'pl',
    showInEntries: true,
  },
  {
    id: 'pl-doctor',
    name: '医師',
    color: '#2ecc71',
    sortOrder: 2,
    role: 'pl',
    showInEntries: true,
  },
  {
    id: 'pl-lawyer',
    name: '弁護士',
    color: '#9b59b6',
    sortOrder: 3,
    role: 'pl',
    showInEntries: true,
  },
  {
    id: 'pl-detective',
    name: '元刑事',
    color: '#e67e22',
    sortOrder: 4,
    role: 'pl',
    showInEntries: true,
  },
  {
    id: 'npc-victim',
    name: '被害者',
    color: '#607d8b',
    sortOrder: 0,
    role: 'npc',
    showInEntries: true,
  },
  {
    id: 'npc-maid',
    name: 'メイド',
    color: '#8d6e63',
    sortOrder: 1,
    role: 'npc',
    showInEntries: true,
  },
];

/**
 * `[キーワード]` 形式の検索ショートカット辞書。
 * これがあると本文中の `[密室]` 等が SearchLinkButton として描画される。
 */
export const GUIDE_SAMPLE_LINK_KEYWORDS: LinkKeyword[] = [
  { id: 'lk-1', keyword: '密室', createdAt: 0 },
  { id: 'lk-2', keyword: 'ペーパーナイフ', createdAt: 0 },
  { id: 'lk-3', keyword: '遺言書', createdAt: 0 },
  { id: 'lk-4', keyword: '通気口', createdAt: 0 },
  { id: 'lk-5', keyword: '脅迫', createdAt: 0 },
];

/** タイムラインエントリ 2 件（demoData の「当日」セクションから抜粋） */
export const GUIDE_SAMPLE_TIMELINE_ENTRIES: MemoEntry[] = [
  {
    id: 'tl-sample-1',
    type: 'timeline',
    content: '医師の証言：朝食後に被害者と立ち話。「体調が優れない、薬をもらえないか」と相談された',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    eventTime: '9:30',
  },
  {
    id: 'tl-sample-2',
    type: 'timeline',
    content: '医師が死亡を確認。凶器は[ペーパーナイフ]。元刑事が現場保全を指示',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 1,
    eventTime: '11:05',
  },
];

/** 自由メモエントリ 2 件（demoData の「気になるポイント」「推理・仮説」から抜粋） */
export const GUIDE_SAMPLE_FREE_ENTRIES: MemoEntry[] = [
  {
    id: 'free-sample-1',
    type: 'clue',
    content: '書斎の窓は内側から施錠されていた → [密室]の可能性',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    importance: 'high',
  },
  {
    id: 'free-sample-2',
    type: 'text',
    content:
      '実業家は10:00に書斎方向から戻ってきた → 被害者が書斎に入ったのは10:30 → 実業家は書斎で何をしていた？',
    panel: 'free',
    characterTags: ['pl-businessman'],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 1,
  },
];

/** 相関図用の関係線（demoData の関係性を参考に作成） */
export const GUIDE_SAMPLE_RELATIONS: CharacterRelation[] = [
  {
    id: 'rel-1',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-businessman',
    toCharacterId: 'npc-victim',
    label: '共同事業',
    sortOrder: 0,
  },
  {
    id: 'rel-2',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-lawyer',
    toCharacterId: 'npc-victim',
    label: '遺言書相談',
    sortOrder: 1,
  },
  {
    id: 'rel-3',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-businessman',
    toCharacterId: 'pl-writer',
    label: '対立',
    color: '#b04040',
    sortOrder: 2,
  },
];
