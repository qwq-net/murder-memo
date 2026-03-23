import { nanoid } from 'nanoid';

import { putImage } from '@/lib/idb';
import type { Character, CharacterDeduction, CharacterRelation, GameSession, MemoEntry, MemoGroup, TimelineGroup } from '@/types/memo';

/** OffscreenCanvas でプレースホルダ画像を生成し IndexedDB に保存 */
async function createPlaceholderImage(
  label: string,
  bgColor: string,
  textColor: string,
  width = 320,
  height = 200,
): Promise<string> {
  const blobKey = nanoid();
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 枠線
  ctx.strokeStyle = textColor;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, width - 8, height - 8);
  ctx.globalAlpha = 1;

  // テキスト
  ctx.fillStyle = textColor;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  await putImage(blobKey, blob);
  return blobKey;
}

/**
 * デモセッション用のデータを一括生成する。
 * 呼び出しごとに nanoid で新しい ID を振るため、何度呼んでも衝突しない。
 */
export async function buildDemoSession(): Promise<{
  session: GameSession;
  characters: Character[];
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  entries: MemoEntry[];
  deductions: CharacterDeduction[];
  relations: CharacterRelation[];
}> {
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
    opts?: { groupId?: string; importance?: 'low' | 'medium' | 'high'; type?: MemoEntry['type'] },
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
      '医師が被害者の健康診断を行った。「特に異常はないが、精神的に不安定」とのこと',
      [charIds.doctor, charIds.victim],
      '17:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      '夕食。実業家が乾杯の挨拶。被害者は発言が少なく、何か考え込んでいる様子だった',
      [charIds.businessman, charIds.victim],
      '19:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      '被害者と実業家が別室で言い争っていたらしい。メイドが声を聞いたと証言。内容は不明',
      [charIds.businessman, charIds.victim],
      '20:00',
    ),
    tlEntry(
      tlGroupIds.previous,
      '元刑事の証言：廊下で実業家が電話しているのを見かけた。「明日までに片付ける」と話していたとのこと',
      [charIds.detective, charIds.businessman],
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
      '自分（弁護士）が被害者と二人きりで面談。遺言書の書き換えについて相談を受けた',
      [charIds.lawyer, charIds.victim],
      '22:00',
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
      '作家の証言：朝食後にロビーで被害者と実業家がひそひそ話しているのを見た',
      [charIds.writer, charIds.victim, charIds.businessman],
      '9:30',
    ),
    tlEntry(
      tlGroupIds.today,
      '元刑事の証言：10時頃、書斎付近で物音がした気がしたが確認はしなかった',
      [charIds.detective],
      '10:00',
    ),
    tlEntry(
      tlGroupIds.today,
      '医師が死亡を確認。凶器は書斎のペーパーナイフ。元刑事が現場保全を指示',
      [charIds.doctor, charIds.detective],
      '11:05',
    ),
    tlEntry(
      tlGroupIds.today,
      'メイドの証言：11時前に書斎の前を通ったが、ドアは閉まっていて中の様子はわからなかった',
      [charIds.maid],
      '11:00',
    ),
    tlEntry(
      tlGroupIds.today,
      '全員がリビングに集合。元刑事が各自のアリバイ確認を開始',
      [charIds.detective],
      '11:30',
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
    freeEntry(
      '元刑事が書斎を調査。暖炉の通気口は大人が通れるサイズではないとのこと → 密室トリックの脱出経路は別にある？',
      [charIds.detective],
      { groupId: memoGroupIds.freePoints, importance: 'high', type: 'clue' },
    ),
    freeEntry(
      'メイドの証言に矛盾？ 「書斎の前を通った」と言うが、掃除の順番からすると通る必要がないルート',
      [charIds.maid],
      { groupId: memoGroupIds.freePoints, importance: 'medium', type: 'clue' },
    ),
    freeEntry(
      '実業家の手に擦り傷があった。本人は「庭の薔薇の手入れ」と説明',
      [charIds.businessman],
      { groupId: memoGroupIds.freePoints, importance: 'low', type: 'clue' },
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
    freeEntry(
      '作家の「脅されていた人がいる」発言 → 実業家？ 医師？ 自分（弁護士）の可能性も排除できない',
      [charIds.writer],
      { groupId: memoGroupIds.freeTheory },
    ),
    freeEntry(
      'メイドのルート矛盾 → 書斎に用があった？ 何かを確認しに行った可能性',
      [charIds.maid],
      { groupId: memoGroupIds.freeTheory },
    ),
    freeEntry(
      '犯行タイムライン仮説：10:00〜10:30の間に犯人が書斎に侵入し待ち伏せ → 10:30に被害者入室 → 犯行 → 密室偽装して脱出',
      [],
      { groupId: memoGroupIds.freeTheory, importance: 'high' },
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
    freeEntry(
      '被害者の遺言書はどこにある？ 書斎を調べたい。元刑事に許可をもらう必要あり',
      [charIds.detective],
    ),
    freeEntry(
      '作家が何か隠している印象。質問すると回答を濁す場面が多かった',
      [charIds.writer],
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
    personalEntry(
      '被害者から預かった封筒がある。中身は確認していない。「自分に万一のことがあったら開封してほしい」と言われた',
      memoGroupIds.personalHandout,
    ),
    personalEntry(
      '実業家が被害者の事業の株式を大量に保有していることを知っている。被害者の死で株価が変動する可能性',
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
    personalEntry(
      '医師とは同じ大学のOB。信頼できるが、被害者の主治医という立場は気になる',
      undefined,
      { tags: [charIds.doctor], characterDisplayFormat: 'badge', characterDisplayVisibility: 'always' },
    ),
    personalEntry(
      '元刑事は退職後にコンサルをしているらしい。被害者から何か依頼を受けていた？',
      undefined,
      { tags: [charIds.detective], characterDisplayFormat: 'badge', characterDisplayVisibility: 'always' },
    ),
    personalEntry(
      '封筒の中身を開けるべきか迷っている。開けたら目標達成に近づくが、周囲に知られるリスク',
      undefined,
    ),
  ];

  // ── エントリ間リンク ──────────────────────────────────────────────────────
  // content の先頭文字列でエントリを検索して ID を取得するヘルパー
  const findEntry = (prefix: string) => entries.find((e) => e.content.startsWith(prefix));

  // 実業家が書斎方向から戻ってきた ↔ 書斎の窓は内側から施錠（密室と実業家の行動の関連）
  const tlBusinessmanStudy = findEntry('元刑事の証言：実業家が書斎の方向');
  const freeLockedRoom = findEntry('書斎の窓は内側から施錠');
  if (tlBusinessmanStudy && freeLockedRoom) {
    tlBusinessmanStudy.linkedEntryIds = [freeLockedRoom.id];
  }

  // 「ある人物に弱みを握られている」 ↔ 作家「脅されていた人がいる」
  const personalBlackmail = findEntry('被害者は「ある人物に弱みを握られている」');
  const freeWriterThreat = findEntry('作家が「被害者に脅されていた人がいる」');
  if (personalBlackmail && freeWriterThreat) {
    personalBlackmail.linkedEntryIds = [freeWriterThreat.id];
  }

  // 犯行タイムライン仮説 ↔ 実業家10:00の証言 + メイド10:30の証言
  const freeTimeline = findEntry('犯行タイムライン仮説');
  const tlMaidStudy = findEntry('メイドの証言：被害者が書斎に向かう');
  if (freeTimeline && tlBusinessmanStudy && tlMaidStudy) {
    freeTimeline.linkedEntryIds = [tlBusinessmanStudy.id, tlMaidStudy.id];
  }

  // ── 推理メモ（弁護士視点でのサンプル） ──────────────────────────────────
  const deductions: CharacterDeduction[] = [
    { id: nanoid(), sessionId, characterId: charIds.businessman, suspicionLevel: 3, memo: '10:00に書斎方向から戻ってきた。動機（遺産トラブル）もある。最有力', updatedAt: now },
    { id: nanoid(), sessionId, characterId: charIds.writer, suspicionLevel: 2, memo: '前夜に被害者の部屋を訪問。「本を借りた」は本当か？', updatedAt: now },
    { id: nanoid(), sessionId, characterId: charIds.doctor, suspicionLevel: 1, memo: '薬の処方歴あり。毒殺の可能性は低いが一応注意', updatedAt: now },
    { id: nanoid(), sessionId, characterId: charIds.detective, suspicionLevel: 0, memo: '', updatedAt: now },
    { id: nanoid(), sessionId, characterId: charIds.maid, suspicionLevel: 1, memo: '掃除の順番を変えた理由が気になる', updatedAt: now },
  ];

  // ── 相関図 ────────────────────────────────────────────────────────────────
  // プリセット色: 友人=#3498db, 恋人=#e91e8c, 家族=#2ecc71, 上司部下=#8e44ad,
  //              敵対=#e74c3c, 協力者=#27ae60, 知人=#95a5a6, 不明=#7f8c8d
  const relations: CharacterRelation[] = [
    { id: nanoid(), sessionId, fromCharacterId: charIds.businessman, toCharacterId: charIds.victim, label: '共同事業', color: '#8e44ad', sortOrder: 0 },
    { id: nanoid(), sessionId, fromCharacterId: charIds.lawyer, toCharacterId: charIds.victim, label: '知人', color: '#95a5a6', sortOrder: 1 },
    { id: nanoid(), sessionId, fromCharacterId: charIds.doctor, toCharacterId: charIds.victim, label: '知人', color: '#95a5a6', sortOrder: 2 },
    { id: nanoid(), sessionId, fromCharacterId: charIds.writer, toCharacterId: charIds.victim, label: '知人', color: '#95a5a6', sortOrder: 3 },
    { id: nanoid(), sessionId, fromCharacterId: charIds.businessman, toCharacterId: charIds.lawyer, label: '敵対', color: '#e74c3c', sortOrder: 4 },
    { id: nanoid(), sessionId, fromCharacterId: charIds.maid, toCharacterId: charIds.victim, label: '上司部下', color: '#8e44ad', sortOrder: 5 },
  ];

  // ── 画像エントリ（プレースホルダ画像を Canvas で生成） ──────────────────
  const [floorPlanKey, evidenceKey, memoFragmentKey] = await Promise.all([
    createPlaceholderImage('書斎 見取り図', '#2c3e50', '#ecf0f1', 360, 240),
    createPlaceholderImage('証拠: ペーパーナイフ', '#4a1a1a', '#e8c8c8', 320, 200),
    createPlaceholderImage('証拠: メモの断片', '#3d3520', '#e8dfc8', 280, 180),
  ]);

  entries.push(
    freeEntry(
      '書斎の見取り図。窓は南側、暖炉は北壁、入口は東側の1箇所のみ',
      [charIds.detective],
      { groupId: memoGroupIds.freePoints, importance: 'high', type: 'image' },
    ),
    freeEntry(
      '凶器のペーパーナイフ。指紋なし。刃渡り約15cm',
      [charIds.detective],
      { groupId: memoGroupIds.freePoints, importance: 'medium', type: 'image' },
    ),
    freeEntry(
      '被害者のポケットから見つかったメモの断片',
      [charIds.victim],
      { groupId: memoGroupIds.freePoints, importance: 'high', type: 'image' },
    ),
  );
  // 画像エントリに blobKey を設定
  const imageEntries = entries.filter((e) => e.type === 'image');
  imageEntries[0].imageBlobKey = floorPlanKey;
  imageEntries[1].imageBlobKey = evidenceKey;
  imageEntries[2].imageBlobKey = memoFragmentKey;

  return { session, characters, timelineGroups, memoGroups, entries, deductions, relations };
}
