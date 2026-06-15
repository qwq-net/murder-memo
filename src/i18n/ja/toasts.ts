/** コンテキストメニュー操作のトースト（複数形対応）。 */
export const toasts = {
  movedTo: {
    one: '{label}に移動しました',
    other: '{n}件のメモを{label}に移動しました',
  },
  importanceSet: {
    one: '重要度を{label}に設定しました',
    other: '{n}件の重要度を{label}に設定しました',
  },
  importanceCleared: {
    one: '重要度を解除しました',
    other: '{n}件の重要度を解除しました',
  },
  duplicated: {
    one: 'メモを複製しました',
    other: '{n}件のメモを複製しました',
  },
  deleted: {
    one: 'メモを削除しました',
    other: '{n}件のメモを削除しました',
  },
} as const;
