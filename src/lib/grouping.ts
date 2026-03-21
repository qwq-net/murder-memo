import { getHourKey, getHourLabel } from '@/lib/timeParser';
import type { MemoEntry, MemoGroup, TimelineGroup } from '@/types/memo';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export interface HourGroup {
  hour: number;
  label: string;
  entries: MemoEntry[];
}

export interface MemoGroupedResult {
  grouped: { group: MemoGroup; entries: MemoEntry[] }[];
  uncategorized: MemoEntry[];
}

export interface TimelineGroupedResult {
  group: TimelineGroup;
  hourGroups: HourGroup[];
  unknown: MemoEntry[];
}

// ─── メモパネル用グループ分け ─────────────────────────────────────────────────

/**
 * エントリを MemoGroup ごとに分類する。
 * groupId が未設定または存在しないグループを指すエントリは uncategorized に入る。
 */
export function groupEntriesByMemoGroup(
  entries: MemoEntry[],
  groups: MemoGroup[],
): MemoGroupedResult {
  const groupIds = new Set(groups.map((g) => g.id));
  const grouped = groups.map((group) => ({
    group,
    entries: entries.filter((e) => e.groupId === group.id),
  }));
  const uncategorized = entries.filter(
    (e) => !e.groupId || !groupIds.has(e.groupId),
  );
  return { grouped, uncategorized };
}

// ─── タイムラインパネル用グループ分け ─────────────────────────────────────────

/**
 * タイムラインエントリを TimelineGroup → 時間帯 の2階層でグループ化する。
 * 時間未設定のエントリは unknown に入る。
 */
export function groupEntriesByTimeline(
  entries: MemoEntry[],
  timelineGroups: TimelineGroup[],
): TimelineGroupedResult[] {
  return timelineGroups.map((group) => {
    const groupEntries = entries.filter((e) => e.timelineGroupId === group.id);

    const withTime = groupEntries
      .filter((e) => e.eventTimeSortKey != null)
      .sort((a, b) => a.eventTimeSortKey! - b.eventTimeSortKey! || a.sortOrder - b.sortOrder);

    // Map で O(1) ルックアップ
    const hourMap = new Map<number, HourGroup>();
    const hourGroups: HourGroup[] = [];
    for (const entry of withTime) {
      const hour = getHourKey(entry.eventTimeSortKey!);
      const existing = hourMap.get(hour);
      if (existing) {
        existing.entries.push(entry);
      } else {
        const hg: HourGroup = { hour, label: getHourLabel(entry.eventTimeSortKey!), entries: [entry] };
        hourMap.set(hour, hg);
        hourGroups.push(hg);
      }
    }

    const unknown = groupEntries
      .filter((e) => e.eventTimeSortKey == null)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return { group, hourGroups, unknown };
  });
}
