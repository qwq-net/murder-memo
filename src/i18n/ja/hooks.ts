/** カスタムフックが発火するトースト・メッセージ（Undo/Redo・画像・セッション名・ペースト）。 */
export const hooks = {
  undo: {
    done: '元に戻しました: {desc}',
    redone: 'やり直しました: {desc}',
    syncFailed: '変更の保存に失敗しました。重要なデータはバックアップのエクスポートをおすすめします。',
  },
  // describeChange が組み立てる変更内容（{n} で件数を補間。日本語は単複同形）
  change: {
    entryAdded: { one: 'メモ {n}件追加', other: 'メモ {n}件追加' },
    entryRemoved: { one: 'メモ {n}件削除', other: 'メモ {n}件削除' },
    entryEdited: 'メモ編集',
    charAdded: { one: '登場人物 {n}人追加', other: '登場人物 {n}人追加' },
    charRemoved: { one: '登場人物 {n}人削除', other: '登場人物 {n}人削除' },
    charChanged: '登場人物変更',
    timelineGroups: 'タイムライングループ変更',
    memoGroups: 'メモグループ変更',
    deductions: '推理メモ変更',
    relations: '相関図変更',
    generic: '変更',
    separator: '、',
  },
  image: {
    needGroupFirst: '先にメモグループを追加してください',
    loadFailed: '画像の読み込みに失敗しました',
    saveFailed: '画像の保存に失敗しました',
    added: { one: '画像を追加しました', other: '画像を {n} 件追加しました' },
  },
  session: {
    renamed: 'セッション名を変更しました',
    renameFailed: 'セッション名の変更に失敗しました',
  },
} as const;
