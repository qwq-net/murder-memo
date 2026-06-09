import { resolveEventTime } from '@/lib/timeParser';
import type { MemoEntry } from '@/types/memo';

/**
 * タイムライン内のドロップで、移動先の時刻（eventTime / eventTimeSortKey）を決める純関数。
 *
 * - 「不明」列（hour === 'unknown'）へのドロップ → 時刻クリア（両方 undefined）
 * - 時間帯列へのドロップ → ドロップ位置の隣接エントリ（overEntry）の時刻を継承する。
 *   隣接カードが無い（コンテナ背景／空への直接ドロップ）場合は、その時間帯の正時 "H:00"
 *   をフォールバックに使う
 *
 * 継承元の時刻文字列は必ず resolveEventTime に通し、eventTime と eventTimeSortKey が
 * 「両方設定 or 両方 undefined」で整合する状態だけを返す（types/memo.ts の不変条件）。
 */
export function resolveInheritedEventTime(args: {
  hour: number | 'unknown';
  overEntry: MemoEntry | null;
}): { eventTime?: string; eventTimeSortKey?: number } {
  if (args.hour === 'unknown') return { eventTime: undefined, eventTimeSortKey: undefined };

  const source = args.overEntry?.eventTime ?? `${args.hour}:00`;
  const resolved = resolveEventTime(source);
  if (!resolved.valid || resolved.eventTimeSortKey == null) {
    return { eventTime: undefined, eventTimeSortKey: undefined };
  }
  return { eventTime: resolved.eventTime, eventTimeSortKey: resolved.eventTimeSortKey };
}
