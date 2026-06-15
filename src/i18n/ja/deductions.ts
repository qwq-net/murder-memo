/** 推理メモ（DeductionModal / DeductionRowView）の日本語メッセージ。 */
export const deductions = {
  /** モーダルの aria-label */
  ariaLabel: '人物推理メモ',
  /** モーダルヘッダータイトル */
  title: '推理メモ',
  /** 登場人物がいない場合の空メッセージ */
  noCharacters: '登場人物が設定されていません',
  /** PLセクションの見出し */
  sectionPlayer: 'プレイヤー',
  /** 疑惑度の星評価 */
  star: {
    /** 同じ星をクリックして解除するときのタイトル */
    clear: '解除',
    /** 怪しさを設定するときのタイトル（{level} = 1〜3） */
    set: '怪しさ {level}',
  },
} as const;
