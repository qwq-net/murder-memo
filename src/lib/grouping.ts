import { getHourKey, getHourLabel } from '@/lib/timeParser';
import type { MemoEntry, MemoGroup, PanelId, TimelineGroup } from '@/types/memo';

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

// ─── メモグループの表示順 ─────────────────────────────────────────────────────

/**
 * 指定パネルに属するメモグループを表示順（sortOrder 昇順）で返す。
 * パネル表示・入力フォームのセレクタ・右クリックメニュー・テキスト出力で並び順が
 * 食い違わないよう、パネル別のメモグループ取得は必ずこれを経由する。
 * （timeline を渡した場合は常に空配列。メモグループは free / personal のみ）
 */
export function memoGroupsForPanel(groups: MemoGroup[], panel: PanelId): MemoGroup[] {
  return groups.filter((g) => g.panel === panel).sort((a, b) => a.sortOrder - b.sortOrder);
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
  const uncategorized = entries.filter((e) => !e.groupId || !groupIds.has(e.groupId));
  return { grouped, uncategorized };
}

// ─── タイムラインパネル用グループ分け ─────────────────────────────────────────

/**
 * どのタイムライングループにも属さないタイムラインエントリ（孤児）を表示用に返す。
 * timelineGroupId が未設定、または実在しないグループを指すエントリが対象。
 *
 * 通常のアプリ操作では発生しないが、インポートデータや過去の不具合で生じた孤児を
 * 不可視にしないための受け皿（メモパネルの「未分類」と同じ防御思想。
 * groupEntriesByTimeline はグループ一致のみで列挙するため、これが無いと孤児は
 * パネルにもテキスト出力にも一切現れず、削除も移動もできなくなる）。
 *
 * 並びは時刻昇順（時刻なしは末尾）、同位は sortOrder 昇順。
 */
export function unassignedTimelineEntries(
  entries: MemoEntry[],
  timelineGroups: TimelineGroup[],
): MemoEntry[] {
  const groupIds = new Set(timelineGroups.map((g) => g.id));
  return entries
    .filter((e) => !e.timelineGroupId || !groupIds.has(e.timelineGroupId))
    .sort(
      (a, b) =>
        (a.eventTimeSortKey ?? Infinity) - (b.eventTimeSortKey ?? Infinity) ||
        a.sortOrder - b.sortOrder,
    );
}

/**
 * タイムラインエントリを TimelineGroup → 時間帯（時単位）の2階層でグループ化する。
 *
 * - 戻り値は timelineGroups と同じ並び・同じ件数。該当エントリが0件のグループも要素として残る
 * - 各グループ内: eventTimeSortKey が設定されたエントリのみを時刻昇順
 *   （同時刻は sortOrder 昇順）に並べ、「時」単位で hourGroups に束ねる。
 *   hourGroups 自体も時刻の早い順
 * - eventTimeSortKey 未設定のエントリは hourGroups に含まれず、unknown に sortOrder 昇順で入る
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
        const hg: HourGroup = {
          hour,
          label: getHourLabel(entry.eventTimeSortKey!),
          entries: [entry],
        };
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
