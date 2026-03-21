/**
 * EntryContextMenu / BulkContextMenu で共通するメニュー構築ロジック。
 * ラベル定数と各セクションのビルダー関数を集約。
 */

import type {
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  MemoEntry,
  MemoGroup,
  PanelId,
  TimelineGroup,
} from '@/types/memo';
import type { ContextMenuEntry } from '@/components/common/contextMenu';

// ─── ラベル定数 ─────────────────────────────────────────────────────────────

export const FORMAT_LABELS: Record<CharacterDisplayFormat, string> = {
  full: 'フル',
  badge: 'バッジ',
  text: 'テキスト',
};

export const VISIBILITY_LABELS: Record<CharacterDisplayVisibility, string> = {
  always: '常時',
  minimal: 'ミニマル',
  off: 'オフ',
};

export const PANEL_LABELS: Record<PanelId, string> = {
  free: '自由メモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

export const IMPORTANCE_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// ─── ヘルパー型 ──────────────────────────────────────────────────────────────

interface MenuContext {
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  moveEntryToPanel: (id: string, panel: PanelId) => Promise<void>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  settings: {
    defaultCharacterDisplay: Record<PanelId, { format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility }>;
  };
  /** 一括操作後のコールバック（BulkContextMenu用） */
  onDone?: () => void;
}

// ─── ユーティリティ: 単一/一括の統一処理 ─────────────────────────────────────

async function forEntries(
  entries: MemoEntry[],
  fn: (entry: MemoEntry) => Promise<void>,
  onDone?: () => void,
) {
  for (const entry of entries) {
    await fn(entry);
  }
  onDone?.();
}

// ─── カテゴリ移動セクション ──────────────────────────────────────────────────

export function buildCategoryMoveItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const result: ContextMenuEntry[] = [];
  const isBulk = entries.length > 1;
  const commonPanel = entries.every((e) => e.panel === entries[0].panel) ? entries[0].panel : null;

  result.push({ header: true as const, label: isBulk ? `カテゴリ移動 (${entries.length}件)` : 'カテゴリ移動' });

  for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
    // 同じパネルは除外（単一の場合はentry.panel、一括の場合はcommonPanel）
    if (isBulk ? (commonPanel && p === commonPanel) : (p === entries[0].panel)) continue;

    if (p === 'timeline') {
      if (ctx.timelineGroups.length === 0) {
        result.push({ label: `${PANEL_LABELS[p]} へ`, disabled: true, onClick: () => {} });
      } else if (ctx.timelineGroups.length === 1) {
        result.push({
          label: `${PANEL_LABELS[p]} へ`,
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.panel === p) return;
              await ctx.moveEntryToPanel(entry.id, p);
              await ctx.updateEntry(entry.id, { timelineGroupId: ctx.timelineGroups[0].id, type: 'timeline' });
            }, ctx.onDone);
          },
        });
      } else {
        result.push({
          label: `${PANEL_LABELS[p]} へ`,
          submenu: ctx.timelineGroups.map((g) => ({
            label: g.label,
            onClick: async () => {
              await forEntries(entries, async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p);
                await ctx.updateEntry(entry.id, { timelineGroupId: g.id, type: 'timeline' });
              }, ctx.onDone);
            },
          })),
        });
      }
    } else {
      const panelGroups = ctx.memoGroups.filter((g) => g.panel === p);
      result.push({
        label: `${PANEL_LABELS[p]} へ`,
        submenu: [
          {
            label: '未分類',
            onClick: async () => {
              await forEntries(entries, async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p);
                await ctx.updateEntry(entry.id, { groupId: undefined });
              }, ctx.onDone);
            },
          },
          ...panelGroups.map((g) => ({
            label: g.label,
            onClick: async () => {
              await forEntries(entries, async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p);
                await ctx.updateEntry(entry.id, { groupId: g.id });
              }, ctx.onDone);
            },
          })),
        ],
      });
    }
  }

  return result;
}

// ─── グループ移動セクション ──────────────────────────────────────────────────

export function buildGroupMoveItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const result: ContextMenuEntry[] = [];
  const isBulk = entries.length > 1;
  const commonPanel = entries.every((e) => e.panel === entries[0].panel) ? entries[0].panel : null;
  const panel = isBulk ? commonPanel : entries[0].panel;

  const hasGroupSection = (() => {
    if (panel === 'free' || panel === 'personal') {
      return ctx.memoGroups.filter((g) => g.panel === panel).length > 0;
    }
    if (panel === 'timeline') return ctx.timelineGroups.length > 1;
    return false;
  })();

  if (!hasGroupSection) return result;

  result.push({ separator: true as const });
  result.push({ header: true as const, label: isBulk ? `メモグループ移動 (${entries.length}件)` : 'メモグループ移動' });

  if (panel === 'free' || panel === 'personal') {
    const panelGroups = ctx.memoGroups.filter((g) => g.panel === panel);

    // 単一: 自分が未分類でない場合のみ「未分類へ」を表示
    if (isBulk || entries[0].groupId) {
      result.push({
        label: '未分類 へ',
        onClick: async () => {
          await forEntries(entries, async (entry) => {
            if (entry.groupId) await ctx.updateEntry(entry.id, { groupId: undefined });
          }, ctx.onDone);
        },
      });
    }

    for (const g of panelGroups) {
      if (!isBulk && g.id === entries[0].groupId) continue;
      result.push({
        label: `「${g.label}」へ`,
        onClick: async () => {
          await forEntries(entries, async (entry) => {
            if (entry.groupId !== g.id) await ctx.updateEntry(entry.id, { groupId: g.id });
          }, ctx.onDone);
        },
      });
    }
  }

  if (panel === 'timeline') {
    for (const g of ctx.timelineGroups) {
      if (!isBulk && g.id === entries[0].timelineGroupId) continue;
      result.push({
        label: `「${g.label}」へ`,
        onClick: async () => {
          await forEntries(entries, async (entry) => {
            if (entry.timelineGroupId !== g.id) await ctx.updateEntry(entry.id, { timelineGroupId: g.id });
          }, ctx.onDone);
        },
      });
    }
  }

  return result;
}

// ─── 重要度設定セクション ────────────────────────────────────────────────────

export function buildImportanceItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const result: ContextMenuEntry[] = [];
  const isBulk = entries.length > 1;
  const hasNonImage = entries.some((e) => e.type !== 'image');
  if (!hasNonImage) return result;

  result.push({ separator: true as const });
  result.push({ header: true as const, label: isBulk ? `重要度設定 (${entries.length}件)` : '重要度設定' });

  for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
    if (!isBulk && entries[0].importance === key) continue;
    result.push({
      label: `${label} に設定`,
      onClick: async () => {
        await forEntries(entries, async (entry) => {
          if (entry.type !== 'image') await ctx.updateEntry(entry.id, { importance: key as MemoEntry['importance'] });
        }, ctx.onDone);
      },
    });
  }

  const hasImportance = entries.some((e) => e.importance);
  if (isBulk || entries[0].importance) {
    result.push({
      label: '設定をはずす',
      disabled: !hasImportance,
      onClick: hasImportance
        ? async () => {
            await forEntries(entries, async (entry) => {
              if (entry.importance) await ctx.updateEntry(entry.id, { importance: undefined });
            }, ctx.onDone);
          }
        : () => {},
    });
  }

  return result;
}

// ─── 役職表示設定セクション ──────────────────────────────────────────────────

export function buildDisplayItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const result: ContextMenuEntry[] = [];
  const isBulk = entries.length > 1;

  // 形式
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentFormat = !isBulk ? (entries[0].characterDisplayFormat ?? panelDefault!.format) : null;

    result.push({ separator: true as const });
    result.push({
      header: true as const,
      label: isBulk
        ? `役職表示形式 (${entries.length}件)`
        : `役職表示形式（現在: ${FORMAT_LABELS[currentFormat!]}）`,
    });

    for (const fmt of ['full', 'badge', 'text'] as CharacterDisplayFormat[]) {
      const isCurrent = !isBulk && fmt === currentFormat;
      result.push({
        label: isCurrent ? FORMAT_LABELS[fmt] : `${FORMAT_LABELS[fmt]} へ変更`,
        disabled: isCurrent,
        onClick: isCurrent
          ? () => {}
          : async () => {
              await forEntries(entries, async (entry) => {
                await ctx.updateEntry(entry.id, { characterDisplayFormat: fmt });
              }, ctx.onDone);
            },
      });
    }
  }

  // モード
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentVisibility = !isBulk ? (entries[0].characterDisplayVisibility ?? panelDefault!.visibility) : null;

    result.push({ separator: true as const });
    result.push({
      header: true as const,
      label: isBulk
        ? `役職表示モード (${entries.length}件)`
        : `役職表示モード（現在: ${VISIBILITY_LABELS[currentVisibility!]}）`,
    });

    for (const vis of ['always', 'minimal', 'off'] as CharacterDisplayVisibility[]) {
      const isCurrent = !isBulk && vis === currentVisibility;
      result.push({
        label: isCurrent ? VISIBILITY_LABELS[vis] : `${VISIBILITY_LABELS[vis]} へ変更`,
        disabled: isCurrent,
        onClick: isCurrent
          ? () => {}
          : async () => {
              await forEntries(entries, async (entry) => {
                await ctx.updateEntry(entry.id, { characterDisplayVisibility: vis });
              }, ctx.onDone);
            },
      });
    }
  }

  // デフォルトに戻す
  {
    result.push({ separator: true as const });
    result.push({
      header: true as const,
      label: isBulk ? `役職表示設定 (${entries.length}件)` : '役職表示設定',
    });

    const hasExplicit = entries.some(
      (e) => e.characterDisplayFormat != null || e.characterDisplayVisibility != null,
    );
    result.push({
      label: 'デフォルトに戻す',
      disabled: !hasExplicit,
      onClick: hasExplicit
        ? async () => {
            await forEntries(entries, async (entry) => {
              if (entry.characterDisplayFormat != null || entry.characterDisplayVisibility != null) {
                await ctx.updateEntry(entry.id, {
                  characterDisplayFormat: undefined,
                  characterDisplayVisibility: undefined,
                });
              }
            }, ctx.onDone);
          }
        : () => {},
    });
  }

  return result;
}

// ─── 削除セクション ──────────────────────────────────────────────────────────

export function buildDeleteItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const isBulk = entries.length > 1;
  return [
    { separator: true as const },
    {
      label: isBulk ? `削除 (${entries.length}件)` : '削除',
      danger: true,
      onClick: async () => {
        await forEntries(entries, async (entry) => {
          await ctx.deleteEntry(entry.id);
        }, ctx.onDone);
      },
    },
  ];
}
