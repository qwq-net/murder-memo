import { groupEntriesByTimeline } from '@/lib/grouping';
import { getHourKey } from '@/lib/timeParser';
import { resolveInheritedEventTime } from '@/lib/timelineDrop';
import type { MemoEntry, PanelId, TimelineGroup } from '@/types/memo';

/**
 * エントリ DnD の「ドロップ先コンテナ」を表す droppable id の生成・解析ユーティリティ。
 *
 * 跨ぎ DnD では、各リスト（メモグループ / タイムラインの時間帯・不明）を droppable な
 * 「コンテナ」として扱う。ドロップ確定時に over.id（カード id か コンテナ id）から
 * 「どのパネル・グループ・時間帯へ移すか」を一意に逆引きするため、コンテナ id の命名規約を
 * ここに集約する（列の描画側と確定側で同じ関数を使い、表現のずれを防ぐ）。
 */

/** 未分類メモグループを表すサフィックス（groupId === undefined 相当）。 */
export const UNCATEGORIZED = '__uncat__';

export type MemoPanel = 'free' | 'personal';

/** メモ列（free/personal のグループ or 未分類）の droppable id。 */
export function memoContainerId(panel: MemoPanel, groupId: string | undefined): string {
  return `memo:${panel}:${groupId ?? UNCATEGORIZED}`;
}

/** タイムラインの時間帯（時単位）列の droppable id。 */
export function timelineHourContainerId(timelineGroupId: string, hour: number): string {
  return `tl:${timelineGroupId}:hour:${hour}`;
}

/** タイムラインの「不明（時刻なし）」列、および空のタイムライングループの droppable id。 */
export function timelineUnknownContainerId(timelineGroupId: string): string {
  return `tl:${timelineGroupId}:unknown`;
}

export type ParsedContainer =
  | { kind: 'memo'; panel: MemoPanel; groupId: string | undefined }
  | { kind: 'timeline'; timelineGroupId: string; hour: number | 'unknown' };

/**
 * droppable id を解析してコンテナの意味（パネル・グループ・時間帯）を返す。
 * カード id（nanoid）は命名規約に一致しないため null を返す。
 */
export function parseContainerId(id: string): ParsedContainer | null {
  if (id.startsWith('memo:')) {
    // memo:${panel}:${groupId} — groupId にコロンは含まれない（nanoid / UNCATEGORIZED）
    const rest = id.slice('memo:'.length);
    const sep = rest.indexOf(':');
    if (sep === -1) return null;
    const panel = rest.slice(0, sep) as MemoPanel;
    if (panel !== 'free' && panel !== 'personal') return null;
    const raw = rest.slice(sep + 1);
    return { kind: 'memo', panel, groupId: raw === UNCATEGORIZED ? undefined : raw };
  }
  if (id.startsWith('tl:')) {
    // tl:${timelineGroupId}:hour:${hour} | tl:${timelineGroupId}:unknown
    const unknownMatch = id.match(/^tl:(.+):unknown$/);
    if (unknownMatch)
      return { kind: 'timeline', timelineGroupId: unknownMatch[1], hour: 'unknown' };
    const hourMatch = id.match(/^tl:(.+):hour:(\d+)$/);
    if (hourMatch) {
      return { kind: 'timeline', timelineGroupId: hourMatch[1], hour: parseInt(hourMatch[2], 10) };
    }
    return null;
  }
  return null;
}

/** エントリ自身が現在所属するコンテナ id を返す（カードへのドロップ時の逆引きに使う）。 */
export function entryContainerId(entry: MemoEntry): string {
  if (entry.panel === 'timeline') {
    const tgId = entry.timelineGroupId ?? '';
    return entry.eventTimeSortKey != null
      ? timelineHourContainerId(tgId, getHourKey(entry.eventTimeSortKey))
      : timelineUnknownContainerId(tgId);
  }
  return memoContainerId(entry.panel as MemoPanel, entry.groupId);
}

export interface DropResolution {
  /** ドロップ先コンテナの解析結果 */
  container: ParsedContainer;
  /** ドロップ先コンテナの id 文字列 */
  containerId: string;
  /** ドロップ位置のカード id（コンテナ背景へ直接ドロップした場合は null = 末尾） */
  overEntryId: string | null;
}

/**
 * over.id（カード id か コンテナ id）から、移動先コンテナと挿入位置の基準カードを解決する。
 * - over がコンテナ id → そのコンテナ、overEntryId=null（末尾扱い）
 * - over がカード id  → そのカードの所属コンテナ、overEntryId=カード id
 * 解決できなければ null。
 */
export function resolveDropTarget(
  overId: string,
  entriesById: Map<string, MemoEntry>,
): DropResolution | null {
  const parsed = parseContainerId(overId);
  if (parsed) return { container: parsed, containerId: overId, overEntryId: null };
  const overEntry = entriesById.get(overId);
  if (!overEntry) return null;
  const containerId = entryContainerId(overEntry);
  const c = parseContainerId(containerId);
  if (!c) return null;
  return { container: c, containerId, overEntryId: overId };
}

/**
 * 移動先パネルのエントリ並び（表示順）に active を挿入した、新しい id 順を返す純関数。
 *
 * - panelOrderedIds: 移動先パネルの表示順 id（active を含む場合＝同一パネル内移動、
 *   含まない場合＝別パネルからの流入、どちらも可）
 * - overEntryId があれば そのカードの位置へ挿入する。同一パネル内で下方向へドラッグした
 *   ときは over の直後、それ以外は over の直前（既存 arrayMove と同じ体感）
 * - overEntryId が null（コンテナ背景／空コンテナへのドロップ）なら、そのコンテナに属する
 *   最後の要素の直後へ。コンテナが空ならパネル末尾へ
 *
 * 戻り値は moveEntryAcrossContainers の orderedIds（sortOrder を index で再採番）に渡す。
 */
export function computeReorderedIds(args: {
  panelOrderedIds: string[];
  activeId: string;
  targetContainerId: string;
  overEntryId: string | null;
  containerOf: (id: string) => string | null;
}): string[] {
  const { panelOrderedIds, activeId, targetContainerId, overEntryId, containerOf } = args;
  const activeIndexFull = panelOrderedIds.indexOf(activeId);
  const without = panelOrderedIds.filter((id) => id !== activeId);

  let insertIndex: number;
  if (overEntryId && overEntryId !== activeId) {
    const overIdx = without.indexOf(overEntryId);
    if (overIdx === -1) {
      insertIndex = without.length;
    } else {
      const overIndexFull = panelOrderedIds.indexOf(overEntryId);
      const draggingDown = activeIndexFull !== -1 && activeIndexFull < overIndexFull;
      insertIndex = draggingDown ? overIdx + 1 : overIdx;
    }
  } else {
    let lastIdx = -1;
    for (let i = 0; i < without.length; i++) {
      if (containerOf(without[i]) === targetContainerId) lastIdx = i;
    }
    insertIndex = lastIdx === -1 ? without.length : lastIdx + 1;
  }

  const result = [...without];
  result.splice(insertIndex, 0, activeId);
  return result;
}

/**
 * ドロップ確定に必要な情報を1つにまとめた結果。null なら移動なし（no-op）。
 * そのまま store の moveEntryAcrossContainers へ渡す。
 */
export interface EntryMove {
  id: string;
  panel: PanelId;
  groupId?: string;
  timelineGroupId?: string;
  eventTime?: string;
  eventTimeSortKey?: number;
  orderedIds: string[];
}

/** タイムラインパネルのエントリを表示順（グループ→時間帯→不明）に並べた id 列を返す。 */
function timelineDisplayOrder(entries: MemoEntry[], timelineGroups: TimelineGroup[]): string[] {
  const grouped = groupEntriesByTimeline(
    entries.filter((e) => e.panel === 'timeline'),
    timelineGroups,
  );
  const ids: string[] = [];
  for (const g of grouped) {
    for (const hg of g.hourGroups) for (const e of hg.entries) ids.push(e.id);
    for (const e of g.unknown) ids.push(e.id);
  }
  return ids;
}

/** メモパネル（free/personal）のエントリを表示順（sortOrder 昇順）に並べた id 列を返す。 */
function memoDisplayOrder(entries: MemoEntry[], panel: MemoPanel): string[] {
  return entries
    .filter((e) => e.panel === panel)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((e) => e.id);
}

/**
 * ドラッグ確定イベント（active / over の id）から、moveEntryAcrossContainers に渡す移動内容を
 * 組み立てる純関数。コンテナ跨ぎ（メモグループ / 時間帯 / TLグループ / パネル）を統一的に解決する。
 *
 * - over が無い / 自分自身へのドロップ / 解決不能 → null（no-op）
 * - タイムラインへのドロップでは時刻継承（resolveInheritedEventTime）を適用する
 * - フィルタ等によるガードは呼び手（DnD コンテキスト）が別途行う
 */
export function planEntryMove(args: {
  activeId: string;
  overId: string;
  entries: MemoEntry[];
  timelineGroups: TimelineGroup[];
}): EntryMove | null {
  const { activeId, overId, entries, timelineGroups } = args;
  if (activeId === overId) return null;

  const entriesById = new Map(entries.map((e) => [e.id, e]));
  const activeEntry = entriesById.get(activeId);
  if (!activeEntry) return null;

  const target = resolveDropTarget(overId, entriesById);
  if (!target) return null;

  const overEntry = target.overEntryId ? (entriesById.get(target.overEntryId) ?? null) : null;
  const containerOf = (id: string): string | null => {
    const e = entriesById.get(id);
    return e ? entryContainerId(e) : null;
  };

  if (target.container.kind === 'memo') {
    const { panel, groupId } = target.container;
    const panelOrderedIds = memoDisplayOrder(entries, panel);
    const orderedIds = computeReorderedIds({
      panelOrderedIds,
      activeId,
      targetContainerId: target.containerId,
      overEntryId: target.overEntryId,
      containerOf,
    });
    return { id: activeId, panel, groupId, orderedIds };
  }

  // timeline コンテナ
  const { timelineGroupId, hour } = target.container;
  const { eventTime, eventTimeSortKey } = resolveInheritedEventTime({ hour, overEntry });
  const panelOrderedIds = timelineDisplayOrder(entries, timelineGroups);
  const orderedIds = computeReorderedIds({
    panelOrderedIds,
    activeId,
    targetContainerId: target.containerId,
    overEntryId: target.overEntryId,
    containerOf,
  });
  return {
    id: activeId,
    panel: 'timeline',
    timelineGroupId,
    eventTime,
    eventTimeSortKey,
    orderedIds,
  };
}
