import type {
  Character,
  CharacterDeduction,
  CharacterRelation,
  LinkKeyword,
  MemoEntry,
  MemoGroup,
  TimelineGroup,
} from '@/types/memo';

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

/**
 * 重要度プレビュー用の clue エントリ 3 件（低 / 中 / 高）。
 * `demoData.ts` の clue 系メモから 1 件ずつ抜粋。
 */
export const GUIDE_SAMPLE_IMPORTANCE_ENTRIES: MemoEntry[] = [
  {
    id: 'imp-sample-low',
    type: 'clue',
    content: '実業家の手に擦り傷。本人は「庭の薔薇の手入れ」と説明。',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    importance: 'low',
  },
  {
    id: 'imp-sample-medium',
    type: 'clue',
    content: '作家が「被害者に[脅迫]されていた人がいる」と発言。誰のことかは言わず。',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 1,
    importance: 'medium',
  },
  {
    id: 'imp-sample-high',
    type: 'clue',
    content: '書斎の窓は内側から施錠されていた → [密室]の可能性。',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 2,
    importance: 'high',
  },
];

/** 時刻自動補完の入力例 → 結果のペア。表データのみ。 */
export const GUIDE_SAMPLE_TIME_PAIRS: { input: string; output: string }[] = [
  { input: '1300', output: '13:00' },
  { input: '530', output: '5:30' },
  { input: '9', output: '9:00' },
  { input: '130', output: '1:30' },
];

/** インライン色付けプレビュー用 — 本文に複数の人物名が登場するメモ */
export const GUIDE_SAMPLE_INLINE_ENTRY: MemoEntry = {
  id: 'inline-sample',
  type: 'text',
  content:
    '実業家と被害者が別室で言い争い。メイドが声を聞いたと証言。元刑事の証言：廊下で実業家が電話していた。',
  panel: 'free',
  characterTags: [],
  createdAt: 0,
  updatedAt: 0,
  sortOrder: 0,
};

/** タイムラインマーカープレビュー用 — eventTime 付きの 1 件 */
export const GUIDE_SAMPLE_TIMELINE_MARKER_ENTRY: MemoEntry = {
  id: 'marker-sample',
  type: 'timeline',
  content: '医師が死亡を確認。凶器は[ペーパーナイフ]。',
  panel: 'timeline',
  characterTags: [],
  createdAt: 0,
  updatedAt: 0,
  sortOrder: 0,
  eventTime: '11:05',
};

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

/**
 * 時間帯セパレータプレビュー用 — 同時刻あり / 時刻なし含む 5 件。
 *
 * 9:30, 10:00, 10:00（同時刻）, 10:30 と並べ、隣接同時刻のラベル省略表現を見せる。
 * 末尾の 1 件は eventTime なし（「不明」セクション用）。
 */
export const GUIDE_SAMPLE_HOUR_GROUPED_ENTRIES: MemoEntry[] = [
  {
    id: 'hg-1',
    type: 'timeline',
    content: '医師の証言：朝食後に被害者と立ち話。体調が優れないと相談された。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    eventTime: '9:30',
    eventTimeSortKey: 9 * 60 + 30,
  },
  {
    id: 'hg-2',
    type: 'timeline',
    content: '元刑事の証言：実業家が書斎方向から戻ってくるのを見た。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 1,
    eventTime: '10:00',
    eventTimeSortKey: 10 * 60,
  },
  {
    id: 'hg-3',
    type: 'timeline',
    content: '作家の証言：ロビーで被害者と実業家がひそひそ話をしていた。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 2,
    eventTime: '10:00',
    eventTimeSortKey: 10 * 60,
  },
  {
    id: 'hg-4',
    type: 'timeline',
    content: 'メイドの証言：被害者が書斎へ向かうのを見た。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 3,
    eventTime: '10:30',
    eventTimeSortKey: 10 * 60 + 30,
  },
  {
    id: 'hg-5',
    type: 'timeline',
    content: 'メイドが深夜に不審な電話を目撃したらしい（時刻・相手不明）。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 4,
  },
];

/**
 * グループヘッダープレビュー用のサンプルグループ。
 * 自由メモ用 2 件 / タイムライン用 1 件、collapsed 違いを混ぜる。
 */
export const GUIDE_SAMPLE_MEMO_GROUPS: MemoGroup[] = [
  {
    id: 'mg-1',
    sessionId: 'guide-sample',
    panel: 'free',
    label: '気になるポイント',
    sortOrder: 0,
    collapsed: false,
  },
  {
    id: 'mg-2',
    sessionId: 'guide-sample',
    panel: 'free',
    label: '推理・仮説',
    sortOrder: 1,
    collapsed: true,
  },
];

export const GUIDE_SAMPLE_TIMELINE_GROUPS: TimelineGroup[] = [
  { id: 'tg-1', sessionId: 'guide-sample', label: '前日', sortOrder: 0, collapsed: true },
  { id: 'tg-2', sessionId: 'guide-sample', label: '当日', sortOrder: 1, collapsed: false },
];

/**
 * 推理メモプレビュー用 — 疑惑度 0/1/2/3 を網羅する 4 件。
 * sessionId はダミー値で OK（DeductionRowView は使わない）。
 */
export const GUIDE_SAMPLE_DEDUCTIONS: CharacterDeduction[] = [
  {
    id: 'dd-1',
    sessionId: 'guide-sample',
    characterId: 'pl-businessman',
    suspicionLevel: 3,
    memo: '10:00 に書斎方向から戻ってきた点が引っかかる。',
    updatedAt: 0,
  },
  {
    id: 'dd-2',
    sessionId: 'guide-sample',
    characterId: 'pl-writer',
    suspicionLevel: 2,
    memo: '「脅迫されていた人がいる」発言の真意が気になる。',
    updatedAt: 0,
  },
  {
    id: 'dd-3',
    sessionId: 'guide-sample',
    characterId: 'pl-doctor',
    suspicionLevel: 1,
    memo: '被害者と立ち話していた。',
    updatedAt: 0,
  },
  {
    id: 'dd-4',
    sessionId: 'guide-sample',
    characterId: 'pl-detective',
    suspicionLevel: 0,
    memo: '',
    updatedAt: 0,
  },
];

/**
 * 拡張相関図用 — プリセット色 + memo 付き 6 本。
 * 相関図セクションの詳細プレビューで使う。
 */
export const GUIDE_SAMPLE_RELATIONS_FULL: CharacterRelation[] = [
  {
    id: 'rf-1',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-businessman',
    toCharacterId: 'npc-victim',
    label: '共同事業',
    color: '#27ae60',
    memo: 'トラブルを抱えていたらしい',
    sortOrder: 0,
  },
  {
    id: 'rf-2',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-lawyer',
    toCharacterId: 'npc-victim',
    label: '遺言書相談',
    color: '#3498db',
    sortOrder: 1,
  },
  {
    id: 'rf-3',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-businessman',
    toCharacterId: 'pl-writer',
    label: '対立',
    color: '#e74c3c',
    sortOrder: 2,
  },
  {
    id: 'rf-4',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-doctor',
    toCharacterId: 'npc-victim',
    label: '主治医',
    color: '#95a5a6',
    sortOrder: 3,
  },
  {
    id: 'rf-5',
    sessionId: 'guide-sample',
    fromCharacterId: 'pl-detective',
    toCharacterId: 'npc-maid',
    label: '知人',
    color: '#95a5a6',
    sortOrder: 4,
  },
  {
    id: 'rf-6',
    sessionId: 'guide-sample',
    fromCharacterId: 'npc-victim',
    toCharacterId: 'npc-maid',
    label: '上司部下',
    color: '#8e44ad',
    sortOrder: 5,
  },
];

/**
 * 画像メモプレビュー用 — 1 件。
 * 画像 URL は `/logo.svg` を流用（IndexedDB に依存しない値）。
 */
export const GUIDE_SAMPLE_IMAGE_ENTRY: MemoEntry = {
  id: 'img-sample',
  type: 'image',
  content: '凶器の[ペーパーナイフ]を別角度から撮影。柄の部分に擦れた跡あり。',
  panel: 'free',
  characterTags: [],
  createdAt: 0,
  updatedAt: 0,
  sortOrder: 0,
  imageBlobKey: 'guide-sample-image',
};

export const GUIDE_SAMPLE_IMAGE_SRC = '/logo.svg';

/**
 * 検索結果プレビュー用 — 3 パネルからそれぞれ 1 件ずつ。
 * クエリ「実業家」でヒットする想定。
 */
export const GUIDE_SAMPLE_SEARCH_QUERY = '実業家';

export const GUIDE_SAMPLE_SEARCH_RESULTS: MemoEntry[] = [
  {
    id: 'sr-tl',
    type: 'timeline',
    content: '夕食。実業家が乾杯の挨拶。被害者は発言が少なく、何か考え込んでいる様子だった。',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    eventTime: '19:00',
  },
  {
    id: 'sr-free',
    type: 'text',
    content: '実業家と被害者は共同事業のトラブルを抱えていたらしい。関係を深掘りする必要あり。',
    panel: 'free',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
  },
  {
    id: 'sr-personal',
    type: 'text',
    content: '実業家の手の擦り傷が気になる。本人の説明は薔薇の手入れだが、本当か？',
    panel: 'personal',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
  },
];

/**
 * `[キーワード]` 記法プレビュー用 — `[ペーパーナイフ]` を含む 1 件。
 */
export const GUIDE_SAMPLE_LINK_SYNTAX_ENTRY: MemoEntry = {
  id: 'link-syntax-sample',
  type: 'text',
  content: '凶器は[ペーパーナイフ]と判明。前日の[密室]状況も気になる。',
  panel: 'free',
  characterTags: [],
  createdAt: 0,
  updatedAt: 0,
  sortOrder: 0,
};
