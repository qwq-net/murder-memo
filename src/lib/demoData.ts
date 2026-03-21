import { nanoid } from 'nanoid';

import type { Character, GameSession, MemoEntry, MemoGroup, TimelineGroup } from '@/types/memo';

/**
 * デモセッション用のデータを一括生成する。
 * 呼び出しごとに nanoid で新しい ID を振るため、何度呼んでも衝突しない。
 */
export function buildDemoSession(): {
  session: GameSession;
  characters: Character[];
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  entries: MemoEntry[];
} {
  const sessionId = nanoid();
  const now = Date.now();

  // ── セッション ──────────────────────────────────────────────────────────
  const session: GameSession = {
    id: sessionId,
    name: 'サンプルシナリオ',
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  };

  // ── キャラクター ────────────────────────────────────────────────────────
  const charIds = {
    businessman: nanoid(), // 実業家
    writer: nanoid(), // 作家
    doctor: nanoid(), // 医師
    lawyer: nanoid(), // 弁護士（自分）
    detective: nanoid(), // 元刑事
    victim: nanoid(), // 被害者
    maid: nanoid(), // メイド
  };

  const characters: Character[] = [
    { id: charIds.businessman, name: '実業家', color: '#e74c3c', sortOrder: 0, role: 'pl', showInEntries: true },
    { id: charIds.writer, name: '作家', color: '#3498db', sortOrder: 1, role: 'pl', showInEntries: true },
    { id: charIds.doctor, name: '医師', color: '#2ecc71', sortOrder: 2, role: 'pl', showInEntries: true },
    { id: charIds.lawyer, name: '弁護士', color: '#9b59b6', sortOrder: 3, role: 'pl', showInEntries: true },
    { id: charIds.detective, name: '元刑事', color: '#e67e22', sortOrder: 4, role: 'pl', showInEntries: true },
    { id: charIds.victim, name: '被害者', color: '#607d8b', sortOrder: 0, role: 'npc', showInEntries: true },
    { id: charIds.maid, name: 'メイド', color: '#8d6e63', sortOrder: 1, role: 'npc', showInEntries: true },
  ];

  // ── タイムライングループ ────────────────────────────────────────────────
  const tlGroupIds = { previous: nanoid(), today: nanoid() };

  const timelineGroups: TimelineGroup[] = [
    { id: tlGroupIds.previous, sessionId, label: '前日', sortOrder: 0, collapsed: false },
    { id: tlGroupIds.today, sessionId, label: '当日', sortOrder: 1, collapsed: false },
  ];

  // ── メモグループ ────────────────────────────────────────────────────────
  const memoGroupIds = {
    freePoints: nanoid(),
    freeTheory: nanoid(),
    personalHandout: nanoid(),
    personalSecret: nanoid(),
  };

  const memoGroups: MemoGroup[] = [
    { id: memoGroupIds.freePoints, sessionId, panel: 'free', label: '気になるポイント', sortOrder: 0, collapsed: false },
    { id: memoGroupIds.freeTheory, sessionId, panel: 'free', label: '推理・仮説', sortOrder: 1, collapsed: false },
    { id: memoGroupIds.personalHandout, sessionId, panel: 'personal', label: '自分のハンドアウト', sortOrder: 0, collapsed: false },
    { id: memoGroupIds.personalSecret, sessionId, panel: 'personal', label: '秘密の目標', sortOrder: 1, collapsed: false },
  ];

  // ── ヘルパー ────────────────────────────────────────────────────────────
  const sortCounter = { free: 0, personal: 0, timeline: 0 };

  /** eventTime → eventTimeSortKey 変換 (HH:MM → 分) */
  const toSortKey = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  /** タイムラインエントリ */
  const tlEntry = (
    groupId: string,
    content: string,
    tags: string[],
    eventTime?: string,
  ): MemoEntry => ({
    id: nanoid(),
    type: 'timeline',
    content,
    panel: 'timeline',
    characterTags: tags,
    createdAt: now,
    updatedAt: now,
    sortOrder: sortCounter.timeline++,
    timelineGroupId: groupId,
    eventTime,
    eventTimeSortKey: eventTime ? toSortKey(eventTime) : undefined,
  });

  /** 自由メモエントリ */
  const freeEntry = (
    content: string,
    tags: string[],
    opts?: { groupId?: string; importance?: 'low' | 'medium' | 'high'; type?: 'text' | 'clue' },
  ): MemoEntry => ({
    id: nanoid(),
    type: opts?.type ?? 'text',
    content,
    panel: 'free',
    characterTags: tags,
    createdAt: now,
    updatedAt: now,
    sortOrder: sortCounter.free++,
    groupId: opts?.groupId,
    importance: opts?.importance,
  });

  /** 個人メモエントリ */
  const personalEntry = (
    content: string,
    groupId?: string,
    opts?: {
      tags?: string[];
      characterDisplayFormat?: 'full' | 'badge' | 'text';
      characterDisplayVisibility?: 'always' | 'minimal' | 'off';
    },
  ): MemoEntry => ({
    id: nanoid(),
    type: 'text',
    content,
    panel: 'personal',
    characterTags: opts?.tags ?? [],
    createdAt: now,
    updatedAt: now,
    sortOrder: sortCounter.personal++,
    groupId,
    characterDisplayFormat: opts?.characterDisplayFormat,
    characterDisplayVisibility: opts?.characterDisplayVisibility,
  });

  // ── エントリ ────────────────────────────────────────────────────────────
  const entries: MemoEntry[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // タイムライン: 前日
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    tlEntry(
      tlGroupIds.previous,
      '全員が洋館に到着。実業家が出迎え、各自の部屋に案内された',
      [charIds.businessman],
      '15:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      '被害者と実業家が庭で口論しているのを目撃。内容は聞き取れず',
      [charIds.businessman, charIds.victim],
      '20:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      '被害者が「明日、すべてを話すつもりだ」と意味深な発言。作家と医師がその場にいた',
      [charIds.victim, charIds.writer, charIds.doctor],
      '21:30',
    ),
    tlEntry(
      tlGroupIds.previous,
      '作家が廊下で被害者の部屋から出てくるのを見た（本人に聞いたら「本を借りただけ」とのこと）',
      [charIds.writer, charIds.victim],
      '23:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      'メイドが深夜に不審な電話を目撃したらしい（時刻不明）',
      [charIds.maid],
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // タイムライン: 当日
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    tlEntry(
      tlGroupIds.today,
      '朝食。全員が食堂に集合。被害者は普段どおりの様子だった',
      [charIds.businessman, charIds.writer, charIds.doctor, charIds.lawyer, charIds.detective],
      '9:00',
    ),
    tlEntry(
      tlGroupIds.today,
      '医師の証言：朝食後に被害者と立ち話。「体調が優れない、薬をもらえないか」と相談された',
      [charIds.doctor, charIds.victim],
      '9:30',
    ),
    tlEntry(
      tlGroupIds.today,
      '元刑事の証言：実業家が書斎の方向から戻ってくるのを見た',
      [charIds.detective, charIds.businessman],
      '10:00',
    ),
    tlEntry(
      tlGroupIds.today,
      'メイドの証言：被害者が書斎に向かうのを見た。「誰にも邪魔されたくない」と言っていた',
      [charIds.maid, charIds.victim],
      '10:30',
    ),
    tlEntry(
      tlGroupIds.today,
      '悲鳴を聞いて書斎に駆けつけると、被害者が倒れていた。元刑事と医師が最初に現場に到着',
      [charIds.detective, charIds.doctor],
      '11:00',
    ),
    tlEntry(
      tlGroupIds.today,
      '医師が死亡を確認。凶器は書斎のペーパーナイフ。元刑事が現場保全を指示',
      [charIds.doctor, charIds.detective],
      '11:05',
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 自由メモ: 気になるポイント
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    freeEntry(
      '書斎の窓は内側から施錠されていた。密室の可能性',
      [charIds.detective],
      { groupId: memoGroupIds.freePoints, importance: 'high', type: 'clue' },
    ),
    freeEntry(
      '被害者のポケットから破られたメモの断片が見つかった。「……の件は絶対に……」としか読めない',
      [],
      { groupId: memoGroupIds.freePoints, importance: 'high', type: 'clue' },
    ),
    freeEntry(
      '実業家と被害者は共同事業のトラブルを抱えていたらしい。関係を深掘りする必要あり',
      [charIds.businessman, charIds.victim],
      { groupId: memoGroupIds.freePoints },
    ),
    freeEntry(
      '作家が「被害者に脅されていた人がいる」と発言。誰のことかは言わず',
      [charIds.writer],
      { groupId: memoGroupIds.freePoints, importance: 'medium', type: 'clue' },
    ),
    freeEntry(
      '医師が被害者の体調について「以前から不眠を訴えていた」と証言。薬の処方歴あり',
      [charIds.doctor, charIds.victim],
      { groupId: memoGroupIds.freePoints },
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 自由メモ: 推理・仮説
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    freeEntry(
      '密室に見えるが、書斎の暖炉には通気口がある。ここから出入りできた可能性は？',
      [],
      { groupId: memoGroupIds.freeTheory },
    ),
    freeEntry(
      '動機は遺産か共同事業の利権か？被害者の遺言書の存在を確認したい',
      [],
      { groupId: memoGroupIds.freeTheory },
    ),
    freeEntry(
      '実業家は10:00に書斎方向から戻ってきた → 被害者が書斎に入ったのは10:30 → 実業家は書斎で何をしていた？',
      [charIds.businessman],
      { groupId: memoGroupIds.freeTheory },
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 自由メモ: 未分類
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    freeEntry(
      'メイドが掃除の順番をいつもと変えていた？　些細だが引っかかる',
      [charIds.maid],
      { importance: 'low', type: 'clue' },
    ),
    freeEntry(
      '元刑事から聞いた話：凶器のペーパーナイフに指紋はなかった。犯人は手袋を使った可能性',
      [charIds.detective],
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 個人メモ: 自分のハンドアウト
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    personalEntry(
      '自分は弁護士として被害者に招待された。被害者から「遺言書の件で相談がある」と事前に連絡を受けていた',
      memoGroupIds.personalHandout,
    ),
    personalEntry(
      '被害者とは3年前の裁判で知り合った。以来、法律相談を受ける間柄',
      memoGroupIds.personalHandout,
    ),
    personalEntry(
      '昨晩22時頃、被害者と二人きりで話した。「遺言書を書き換えたい。実業家には渡したくない財産がある」と相談された',
      memoGroupIds.personalHandout,
    ),
    personalEntry(
      '被害者は「ある人物に弱みを握られている」とも言っていた。具体的な名前は聞けなかった',
      memoGroupIds.personalHandout,
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 個人メモ: 秘密の目標
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    personalEntry(
      '【3点】被害者の遺言書を見つけ出し、内容を確認すること',
      memoGroupIds.personalSecret,
    ),
    personalEntry(
      '【2点】昨晩の被害者との会話内容を最後まで秘密にすること',
      memoGroupIds.personalSecret,
    ),
    personalEntry(
      '【2点】真犯人を正しく投票すること',
      memoGroupIds.personalSecret,
    ),
    personalEntry(
      '【1点】実業家が遺産を受け取れないようにすること（被害者の遺志）',
      memoGroupIds.personalSecret,
    ),

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 個人メモ: 未分類（参加者との関連メモ — 表示設定ショーケース）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    personalEntry(
      '実業家とは以前、別の案件で対立したことがある。自分のことを快く思っていない可能性',
      undefined,
      { tags: [charIds.businessman], characterDisplayFormat: 'badge', characterDisplayVisibility: 'always' },
    ),
    personalEntry(
      '作家とは初対面。ただし、作家の最新作のモデルが被害者らしいという噂を聞いたことがある',
      undefined,
      { tags: [charIds.writer], characterDisplayFormat: 'full', characterDisplayVisibility: 'always' },
    ),
  ];

  return { session, characters, timelineGroups, memoGroups, entries };
}
