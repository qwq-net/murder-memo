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
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

export const IMPORTANCE_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// ─── ヘルパー型 ──────────────────────────────────────────────────────────────

export interface MenuContext {
  timelineGroups: TimelineGroup[];
  memoGroups: MemoGroup[];
  moveEntryToPanel: (id: string, panel: PanelId) => Promise<void>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addEntry: (
    partial: Pick<MemoEntry, 'panel'> & Partial<Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>>,
  ) => Promise<MemoEntry>;
  settings: {
    defaultCharacterDisplay: Record<PanelId, { format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility }>;
  };
  /** トースト通知 */
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  /** 一括操作後のコールバック（BulkContextMenu用） */
  onDone?: () => void;
}

/** forEntries のトースト設定 */
interface ToastConfig {
  singular: string;
  plural: (n: number) => string;
}

// ─── ユーティリティ: 単一/一括の統一処理 ─────────────────────────────────────

/**
 * entries を順次処理し、完了後に onDone コールバックとトースト通知を発火する。
 * toast を省略すると通知なしで処理のみ行う（役職表示設定など）。
 */
async function forEntries(
  entries: MemoEntry[],
  fn: (entry: MemoEntry) => Promise<void>,
  ctx: Pick<MenuContext, 'onDone' | 'addToast'>,
  toast?: ToastConfig,
) {
  for (const entry of entries) {
    await fn(entry);
  }
  ctx.onDone?.();
  if (toast) {
    ctx.addToast(entries.length > 1 ? toast.plural(entries.length) : toast.singular);
  }
}

// ─── 移動サブメニュー（パネル移動 + グループ移動を統合） ─────────────────────

export function buildMoveSubmenu(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const isBulk = entries.length > 1;
  const commonPanel = entries.every((e) => e.panel === entries[0].panel) ? entries[0].panel : null;
  const panel = isBulk ? commonPanel : entries[0].panel;

  const sub: ContextMenuEntry[] = [];

  // ── パネル移動 ──
  sub.push({ header: true as const, label: '別パネルへ移動' });

  const moveToast = (p: PanelId): ToastConfig => ({
    singular: `${PANEL_LABELS[p]}に移動しました`,
    plural: (n) => `${n}件のメモを${PANEL_LABELS[p]}に移動しました`,
  });

  for (const p of ['free', 'personal', 'timeline'] as PanelId[]) {
    if (isBulk ? (commonPanel && p === commonPanel) : (p === entries[0].panel)) continue;

    if (p === 'timeline') {
      if (ctx.timelineGroups.length === 0) {
        sub.push({ label: PANEL_LABELS[p], disabled: true, onClick: () => {} });
      } else if (ctx.timelineGroups.length === 1) {
        sub.push({
          label: PANEL_LABELS[p],
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.panel === p) return;
              await ctx.moveEntryToPanel(entry.id, p);
              await ctx.updateEntry(entry.id, { timelineGroupId: ctx.timelineGroups[0].id, type: 'timeline' });
            }, ctx, moveToast(p));
          },
        });
      } else {
        // グループが複数 → フラットに展開（ネストサブメニュー回避）
        for (const g of ctx.timelineGroups) {
          sub.push({
            label: `${PANEL_LABELS[p]}: ${g.label}`,
            onClick: async () => {
              await forEntries(entries, async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p);
                await ctx.updateEntry(entry.id, { timelineGroupId: g.id, type: 'timeline' });
              }, ctx, moveToast(p));
            },
          });
        }
      }
    } else {
      const panelGroups = ctx.memoGroups.filter((g) => g.panel === p);
      if (panelGroups.length === 0) {
        sub.push({
          label: PANEL_LABELS[p],
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.panel === p) return;
              await ctx.moveEntryToPanel(entry.id, p);
              await ctx.updateEntry(entry.id, { groupId: undefined });
            }, ctx, moveToast(p));
          },
        });
      } else {
        // グループあり → フラットに展開（ネストサブメニュー回避）
        sub.push({
          label: `${PANEL_LABELS[p]}: 未分類`,
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.panel === p) return;
              await ctx.moveEntryToPanel(entry.id, p);
              await ctx.updateEntry(entry.id, { groupId: undefined });
            }, ctx, moveToast(p));
          },
        });
        for (const g of panelGroups) {
          sub.push({
            label: `${PANEL_LABELS[p]}: ${g.label}`,
            onClick: async () => {
              await forEntries(entries, async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p);
                await ctx.updateEntry(entry.id, { groupId: g.id });
              }, ctx, moveToast(p));
            },
          });
        }
      }
    }
  }

  // ── グループ移動（同一パネル内） ──
  const hasGroupSection = (() => {
    if (panel === 'free' || panel === 'personal') {
      return ctx.memoGroups.filter((g) => g.panel === panel).length > 0;
    }
    if (panel === 'timeline') return ctx.timelineGroups.length > 1;
    return false;
  })();

  if (hasGroupSection) {
    sub.push({ separator: true as const });
    sub.push({ header: true as const, label: 'グループ変更' });

    const groupToast = (label: string): ToastConfig => ({
      singular: `${label}に移動しました`,
      plural: (n) => `${n}件のメモを${label}に移動しました`,
    });

    if (panel === 'free' || panel === 'personal') {
      const panelGroups = ctx.memoGroups.filter((g) => g.panel === panel);

      if (isBulk || entries[0].groupId) {
        sub.push({
          label: '未分類',
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.groupId) await ctx.updateEntry(entry.id, { groupId: undefined });
            }, ctx, groupToast('未分類'));
          },
        });
      }

      for (const g of panelGroups) {
        if (!isBulk && g.id === entries[0].groupId) continue;
        sub.push({
          label: g.label,
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.groupId !== g.id) await ctx.updateEntry(entry.id, { groupId: g.id });
            }, ctx, groupToast(`「${g.label}」`));
          },
        });
      }
    }

    if (panel === 'timeline') {
      for (const g of ctx.timelineGroups) {
        if (!isBulk && g.id === entries[0].timelineGroupId) continue;
        sub.push({
          label: g.label,
          onClick: async () => {
            await forEntries(entries, async (entry) => {
              if (entry.timelineGroupId !== g.id) await ctx.updateEntry(entry.id, { timelineGroupId: g.id });
            }, ctx, groupToast(`「${g.label}」`));
          },
        });
      }
    }
  }

  return [
    {
      label: isBulk ? `移動 (${entries.length}件)` : '移動',
      submenu: sub,
    },
  ];
}

// ─── 重要度サブメニュー ──────────────────────────────────────────────────────

export function buildImportanceSubmenu(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const isBulk = entries.length > 1;
  const hasNonImage = entries.some((e) => e.type !== 'image');
  if (!hasNonImage) return [];

  const sub: ContextMenuEntry[] = [];

  for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
    if (!isBulk && entries[0].importance === key) continue;
    sub.push({
      label,
      onClick: async () => {
        await forEntries(entries, async (entry) => {
          if (entry.type !== 'image') await ctx.updateEntry(entry.id, { importance: key as MemoEntry['importance'] });
        }, ctx, {
          singular: `重要度を「${label}」に設定しました`,
          plural: (n) => `${n}件の重要度を「${label}」に設定しました`,
        });
      },
    });
  }

  const hasImportance = entries.some((e) => e.importance);
  if (isBulk || entries[0].importance) {
    sub.push({ separator: true as const });
    sub.push({
      label: '解除',
      disabled: !hasImportance,
      onClick: hasImportance
        ? async () => {
            await forEntries(entries, async (entry) => {
              if (entry.importance) await ctx.updateEntry(entry.id, { importance: undefined });
            }, ctx, {
              singular: '重要度を解除しました',
              plural: (n) => `${n}件の重要度を解除しました`,
            });
          }
        : () => {},
    });
  }

  return [
    {
      label: isBulk ? `重要度 (${entries.length}件)` : '重要度',
      submenu: sub,
    },
  ];
}

// ─── 役職表示サブメニュー（形式 + モード + リセットを統合） ───────────────────

export function buildDisplaySubmenu(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  const isBulk = entries.length > 1;
  const sub: ContextMenuEntry[] = [];

  // 形式
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentFormat = !isBulk ? (entries[0].characterDisplayFormat ?? panelDefault!.format) : null;

    sub.push({ header: true as const, label: '表示形式' });

    for (const fmt of ['full', 'badge', 'text'] as CharacterDisplayFormat[]) {
      const isCurrent = !isBulk && fmt === currentFormat;
      sub.push({
        label: isCurrent ? `${FORMAT_LABELS[fmt]}（現在）` : FORMAT_LABELS[fmt],
        disabled: isCurrent,
        onClick: isCurrent
          ? () => {}
          : async () => {
              await forEntries(entries, async (entry) => {
                await ctx.updateEntry(entry.id, { characterDisplayFormat: fmt });
              }, ctx);
            },
      });
    }
  }

  // モード
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentVisibility = !isBulk ? (entries[0].characterDisplayVisibility ?? panelDefault!.visibility) : null;

    sub.push({ separator: true as const });
    sub.push({ header: true as const, label: '表示モード' });

    for (const vis of ['always', 'minimal', 'off'] as CharacterDisplayVisibility[]) {
      const isCurrent = !isBulk && vis === currentVisibility;
      sub.push({
        label: isCurrent ? `${VISIBILITY_LABELS[vis]}（現在）` : VISIBILITY_LABELS[vis],
        disabled: isCurrent,
        onClick: isCurrent
          ? () => {}
          : async () => {
              await forEntries(entries, async (entry) => {
                await ctx.updateEntry(entry.id, { characterDisplayVisibility: vis });
              }, ctx);
            },
      });
    }
  }

  // デフォルトに戻す
  {
    const hasExplicit = entries.some(
      (e) => e.characterDisplayFormat != null || e.characterDisplayVisibility != null,
    );
    sub.push({ separator: true as const });
    sub.push({
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
            }, ctx);
          }
        : () => {},
    });
  }

  return [
    {
      label: isBulk ? `役職表示 (${entries.length}件)` : '役職表示',
      submenu: sub,
    },
  ];
}

// ─── 複製セクション ──────────────────────────────────────────────────────────

export function buildDuplicateItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  return [
    {
      label: entries.length > 1 ? `複製 (${entries.length}件)` : '複製',
      onClick: async () => {
        for (const entry of entries) {
          const { id, createdAt, updatedAt, sortOrder, ...rest } = entry;
          await ctx.addEntry({ ...rest });
        }
        ctx.addToast(
          entries.length > 1
            ? `${entries.length}件のメモを複製しました`
            : 'メモを複製しました',
        );
        ctx.onDone?.();
      },
    },
  ];
}

// ─── 削除セクション ──────────────────────────────────────────────────────────

export function buildDeleteItems(
  entries: MemoEntry[],
  ctx: MenuContext,
): ContextMenuEntry[] {
  return [
    {
      label: entries.length > 1 ? `削除 (${entries.length}件)` : '削除',
      danger: true,
      onClick: async () => {
        await forEntries(entries, async (entry) => {
          await ctx.deleteEntry(entry.id);
        }, ctx, {
          singular: 'メモを削除しました',
          plural: (n) => `${n}件のメモを削除しました`,
        });
      },
    },
  ];
}
