/**
 * EntryContextMenu / BulkContextMenu で共通するメニュー構築ロジック。
 * ラベル定数と各セクションのビルダー関数を集約。
 */

import type { ContextMenuEntry } from '@/components/common/contextMenu';
import { memoGroupsForPanel } from '@/lib/grouping';
import type {
  Character,
  CharacterDisplayFormat,
  CharacterDisplayVisibility,
  MemoEntry,
  MemoGroup,
  PanelId,
  TimelineGroup,
} from '@/types/memo';

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
  /** showInEntries が true のキャラクター一覧（役職マーカー追加用） */
  characters: Character[];
  moveEntryToPanel: (
    id: string,
    panel: PanelId,
    opts?: { timelineGroupId?: string; groupId?: string },
  ) => Promise<void>;
  updateEntry: (id: string, patch: Partial<MemoEntry>) => Promise<void>;
  /** 同一パネル内のメモグループ変更（移動先グループ末尾へ配置） */
  setEntryGroup: (id: string, groupId: string | undefined) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addEntry: (
    partial: Pick<MemoEntry, 'panel'> &
      Partial<Omit<MemoEntry, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>>,
  ) => Promise<MemoEntry>;
  toggleCharacterTag: (entryId: string, characterId: string) => Promise<void>;
  settings: {
    defaultCharacterDisplay: Record<
      PanelId,
      { format: CharacterDisplayFormat; visibility: CharacterDisplayVisibility }
    >;
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

export function buildMoveSubmenu(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
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
    if (isBulk ? commonPanel && p === commonPanel : p === entries[0].panel) continue;

    if (p === 'timeline') {
      if (ctx.timelineGroups.length === 0) {
        sub.push({ label: PANEL_LABELS[p], disabled: true, onClick: () => {} });
      } else if (ctx.timelineGroups.length === 1) {
        sub.push({
          label: PANEL_LABELS[p],
          onClick: async () => {
            await forEntries(
              entries,
              async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p, {
                  timelineGroupId: ctx.timelineGroups[0].id,
                });
              },
              ctx,
              moveToast(p),
            );
          },
        });
      } else {
        // グループが複数 → フラットに展開（ネストサブメニュー回避）
        for (const g of ctx.timelineGroups) {
          sub.push({
            label: `${PANEL_LABELS[p]}: ${g.label}`,
            onClick: async () => {
              await forEntries(
                entries,
                async (entry) => {
                  if (entry.panel === p) return;
                  await ctx.moveEntryToPanel(entry.id, p, { timelineGroupId: g.id });
                },
                ctx,
                moveToast(p),
              );
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
            await forEntries(
              entries,
              async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p, { groupId: undefined });
              },
              ctx,
              moveToast(p),
            );
          },
        });
      } else {
        // グループあり → フラットに展開（ネストサブメニュー回避）
        sub.push({
          label: `${PANEL_LABELS[p]}: 未分類`,
          onClick: async () => {
            await forEntries(
              entries,
              async (entry) => {
                if (entry.panel === p) return;
                await ctx.moveEntryToPanel(entry.id, p, { groupId: undefined });
              },
              ctx,
              moveToast(p),
            );
          },
        });
        for (const g of panelGroups) {
          sub.push({
            label: `${PANEL_LABELS[p]}: ${g.label}`,
            onClick: async () => {
              await forEntries(
                entries,
                async (entry) => {
                  if (entry.panel === p) return;
                  await ctx.moveEntryToPanel(entry.id, p, { groupId: g.id });
                },
                ctx,
                moveToast(p),
              );
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
    if (panel === 'timeline') {
      // 通常は移動先候補が複数ある場合のみ出すが、どのグループにも属さない孤児
      // （インポートデータ等由来。タイムラインの「未分類」に表示される）の救出時は
      // グループが 1 つでも出す（出さないと移動経路が無くなる）
      const groupIds = new Set(ctx.timelineGroups.map((g) => g.id));
      const hasUnassigned = entries.some(
        (e) => !e.timelineGroupId || !groupIds.has(e.timelineGroupId),
      );
      return ctx.timelineGroups.length > 1 || (ctx.timelineGroups.length > 0 && hasUnassigned);
    }
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
      // パネル表示と同じ並び（sortOrder 昇順）でサブメニューに出す
      const panelGroups = memoGroupsForPanel(ctx.memoGroups, panel);

      if (isBulk || entries[0].groupId) {
        sub.push({
          label: '未分類',
          onClick: async () => {
            await forEntries(
              entries,
              async (entry) => {
                if (entry.groupId) await ctx.setEntryGroup(entry.id, undefined);
              },
              ctx,
              groupToast('未分類'),
            );
          },
        });
      }

      for (const g of panelGroups) {
        if (!isBulk && g.id === entries[0].groupId) continue;
        sub.push({
          label: g.label,
          onClick: async () => {
            await forEntries(
              entries,
              async (entry) => {
                if (entry.groupId !== g.id) await ctx.setEntryGroup(entry.id, g.id);
              },
              ctx,
              groupToast(`「${g.label}」`),
            );
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
            await forEntries(
              entries,
              async (entry) => {
                if (entry.timelineGroupId !== g.id)
                  await ctx.updateEntry(entry.id, { timelineGroupId: g.id });
              },
              ctx,
              groupToast(`「${g.label}」`),
            );
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

export function buildImportanceSubmenu(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
  const isBulk = entries.length > 1;

  const sub: ContextMenuEntry[] = [];

  for (const [key, label] of Object.entries(IMPORTANCE_LABELS)) {
    if (!isBulk && entries[0].importance === key) continue;
    sub.push({
      label,
      onClick: async () => {
        await forEntries(
          entries,
          async (entry) => {
            await ctx.updateEntry(entry.id, { importance: key as MemoEntry['importance'] });
          },
          ctx,
          {
            singular: `重要度を「${label}」に設定しました`,
            plural: (n) => `${n}件の重要度を「${label}」に設定しました`,
          },
        );
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
            await forEntries(
              entries,
              async (entry) => {
                if (entry.importance) await ctx.updateEntry(entry.id, { importance: undefined });
              },
              ctx,
              {
                singular: '重要度を解除しました',
                plural: (n) => `${n}件の重要度を解除しました`,
              },
            );
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

export function buildDisplaySubmenu(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
  const isBulk = entries.length > 1;
  const sub: ContextMenuEntry[] = [];

  // 形式
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentFormat = !isBulk
      ? (entries[0].characterDisplayFormat ?? panelDefault!.format)
      : null;

    sub.push({ header: true as const, label: '表示形式' });

    for (const fmt of ['full', 'badge', 'text'] as CharacterDisplayFormat[]) {
      const isCurrent = !isBulk && fmt === currentFormat;
      sub.push({
        label: isCurrent ? `${FORMAT_LABELS[fmt]}（現在）` : FORMAT_LABELS[fmt],
        disabled: isCurrent,
        onClick: isCurrent
          ? () => {}
          : async () => {
              await forEntries(
                entries,
                async (entry) => {
                  await ctx.updateEntry(entry.id, { characterDisplayFormat: fmt });
                },
                ctx,
              );
            },
      });
    }
  }

  // モード
  {
    const panelDefault = !isBulk ? ctx.settings.defaultCharacterDisplay[entries[0].panel] : null;
    const currentVisibility = !isBulk
      ? (entries[0].characterDisplayVisibility ?? panelDefault!.visibility)
      : null;

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
              await forEntries(
                entries,
                async (entry) => {
                  await ctx.updateEntry(entry.id, { characterDisplayVisibility: vis });
                },
                ctx,
              );
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
            await forEntries(
              entries,
              async (entry) => {
                if (
                  entry.characterDisplayFormat != null ||
                  entry.characterDisplayVisibility != null
                ) {
                  await ctx.updateEntry(entry.id, {
                    characterDisplayFormat: undefined,
                    characterDisplayVisibility: undefined,
                  });
                }
              },
              ctx,
            );
          }
        : () => {},
    });
  }

  return [
    {
      label: isBulk ? `役職マーカー設定 (${entries.length}件)` : '役職マーカー設定',
      submenu: sub,
    },
  ];
}

// ─── 役職マーカー追加サブメニュー ────────────────────────────────────────────

export function buildTagSubmenu(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
  const characters = ctx.characters;
  if (characters.length === 0) return [];

  const isBulk = entries.length > 1;
  const sub: ContextMenuEntry[] = [];

  for (const char of characters) {
    // 単一エントリの場合、既にタグ付け済みかどうかを表示
    const isTagged = !isBulk && entries[0].characterTags.includes(char.id);
    sub.push({
      label: isTagged ? `${char.name}（タグ済み）` : char.name,
      onClick: async () => {
        for (const entry of entries) {
          await ctx.toggleCharacterTag(entry.id, char.id);
          // タグ付け時にマーカーが非表示だと見えないので minimal に切り替える
          if (!entry.characterTags.includes(char.id)) {
            const panelDefault = ctx.settings.defaultCharacterDisplay[entry.panel];
            const currentVisibility = entry.characterDisplayVisibility ?? panelDefault.visibility;
            if (currentVisibility === 'off') {
              await ctx.updateEntry(entry.id, { characterDisplayVisibility: 'minimal' });
            }
          }
        }
        ctx.onDone?.();
      },
    });
  }

  return [
    {
      label: isBulk ? `役職マーカー追加 (${entries.length}件)` : '役職マーカー追加',
      submenu: sub,
    },
  ];
}

// ─── 複製セクション ──────────────────────────────────────────────────────────

export function buildDuplicateItems(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
  return [
    {
      label: entries.length > 1 ? `複製 (${entries.length}件)` : '複製',
      onClick: async () => {
        await forEntries(
          entries,
          async (entry) => {
            // 複製では元エントリの id / 各タイムスタンプ / sortOrder は破棄し、
            // addEntry 側で採番させる（rest だけが残れば必要なフィールドはすべて含まれる）。
            // 画像エントリは imageBlobKey をそのまま共有する（複数エントリが同一 blob を指してよい）。
            // 削除は blob をハード削除せず GC で回収する方式（cleanupOrphanImages）のため、
            // 片方を削除しても blob は残り、もう片方の画像は表示され続ける。
            const { id: _id, createdAt: _c, updatedAt: _u, sortOrder: _s, ...rest } = entry;
            try {
              await ctx.addEntry({ ...rest });
            } catch {
              // addEntry 失敗時は addEntry 内でロールバック＋エラートースト済み。
              // ここで握って残りの複製処理を継続する。
            }
          },
          ctx,
          {
            singular: 'メモを複製しました',
            plural: (n) => `${n}件のメモを複製しました`,
          },
        );
      },
    },
  ];
}

// ─── 削除セクション ──────────────────────────────────────────────────────────

export function buildDeleteItems(entries: MemoEntry[], ctx: MenuContext): ContextMenuEntry[] {
  return [
    {
      label: entries.length > 1 ? `削除 (${entries.length}件)` : '削除',
      danger: true,
      onClick: async () => {
        await forEntries(
          entries,
          async (entry) => {
            await ctx.deleteEntry(entry.id);
          },
          ctx,
          {
            singular: 'メモを削除しました',
            plural: (n) => `${n}件のメモを削除しました`,
          },
        );
      },
    },
  ];
}
