import { memoGroupsForPanel } from '@/lib/grouping';
import type { MemoGroup, PanelId, TimelineGroup } from '@/types/memo';

/** グループセレクタに渡す候補（id とラベルのみ） */
export interface GroupCandidate {
  id: string;
  label: string;
}

export interface GroupSelectionResult {
  /** 選択候補（パネルに応じた表示順） */
  candidates: GroupCandidate[];
  /** 実際に有効な選択 ID（候補に無い選択は無効化。timeline は1件時に自動選択） */
  effectiveGroupId: string;
}

/**
 * エントリ入力・グループ選択 UI のグループ候補と有効選択を解決する純関数。
 *
 * entryInput と groupSelector で重複していた派生計算（候補一覧 / 有効選択の解決）を集約し、
 * 片方だけ直して挙動が乖離する事故を防ぐ。
 *
 * - timeline パネル: 候補は timelineGroups
 * - メモパネル（free / personal）: 候補は memoGroupsForPanel（sortOrder 昇順・パネル一致）
 * - それ以外: 候補なし
 * - selectedGroupId が候補に存在しなければ無効化（空文字）
 * - timeline かつグループ1件かつ選択が無効なら、その1件を自動選択する
 */
export function resolveGroupSelection(
  panel: PanelId,
  groups: { timelineGroups: TimelineGroup[]; memoGroups: MemoGroup[] },
  selectedGroupId: string,
): GroupSelectionResult {
  const isTimeline = panel === 'timeline';
  const isMemoPanel = panel === 'free' || panel === 'personal';

  const source: Array<{ id: string; label: string }> = isTimeline
    ? groups.timelineGroups
    : isMemoPanel
      ? memoGroupsForPanel(groups.memoGroups, panel)
      : [];

  // selectedGroupId が現存するグループに含まれなければリセット
  const validSelectedId = source.some((g) => g.id === selectedGroupId) ? selectedGroupId : '';

  const effectiveGroupId =
    isTimeline && groups.timelineGroups.length === 1 && !validSelectedId
      ? groups.timelineGroups[0].id
      : validSelectedId;

  return {
    candidates: source.map((g) => ({ id: g.id, label: g.label })),
    effectiveGroupId,
  };
}
