import type { MemoEntry, PanelId } from '@/types/memo';

/**
 * パネル移動に伴う「timeline 系フィールドの整合 patch」を計算する純関数。
 *
 * パネル横断の移動（moveEntryToPanel / moveEntryAcrossContainers）で、
 * 「panel === 'timeline' は timelineGroupId 必須・type='timeline'」「timeline 以外では
 * timeline 系フィールド（timelineGroupId / eventTime / eventTimeSortKey）をクリアし、type を
 * timeline 以外へ戻す」という不変条件（types/memo.ts の契約）を 1 か所に集約し、両アクションで共用する。
 *
 * type をタイムライン出入りで切り替えるのは、カード表示の一部（entryCardView の左バー位置・
 * 時刻マーカー）が panel ではなく `entry.type === 'timeline'` で分岐するため。出る時に type を
 * 戻さないと、メモパネルに移っても timeline 用レイアウト（左端バーのズレ等）で描画されてしまう。
 * 戻す type は画像なら 'image'（imageBlobKey 参照を持つ）、それ以外は 'text'。
 *
 * groupId は呼び手によって扱いが異なる（moveEntryToPanel は「opts 未指定なら保持」、
 * moveEntryAcrossContainers は「常に明示」）ため、ここには含めず呼び手が決める。
 * sortOrder / updatedAt も呼び手が付与する。
 */
export function timelineFieldPatch(
  panel: PanelId,
  opts: { timelineGroupId?: string; eventTime?: string; eventTimeSortKey?: number } = {},
  source?: Pick<MemoEntry, 'imageBlobKey'>,
): Partial<MemoEntry> {
  if (panel === 'timeline') {
    return {
      type: 'timeline',
      timelineGroupId: opts.timelineGroupId,
      eventTime: opts.eventTime,
      eventTimeSortKey: opts.eventTimeSortKey,
    };
  }
  return {
    type: source?.imageBlobKey ? 'image' : 'text',
    timelineGroupId: undefined,
    eventTime: undefined,
    eventTimeSortKey: undefined,
  };
}
