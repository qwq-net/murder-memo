import { describe, expect, it } from 'vitest';

import {
  buildDeleteItems,
  buildMoveSubmenu,
  type MenuContext,
} from '@/components/entries/actions/menuItems';
import type { TFunc } from '@/lib/i18n';
import type { MemoEntry } from '@/types/memo';

/** ロケール非依存にビルダー構造を検証するためのスタブ t（キー[:n] を返す）。 */
const stubT = ((key: string, params?: { n?: number }) =>
  params?.n != null ? `${key}:${params.n}` : key) as unknown as TFunc;

function makeCtx(overrides: Partial<MenuContext> = {}): MenuContext {
  return {
    t: stubT,
    timelineGroups: [],
    memoGroups: [],
    hiddenPanels: [],
    characters: [],
    moveEntryToPanel: async () => {},
    updateEntry: async () => {},
    setEntryGroup: async () => {},
    deleteEntry: async () => {},
    addEntry: async () => ({}) as MemoEntry,
    toggleCharacterTag: async () => {},
    settings: { defaultCharacterDisplay: {} as MenuContext['settings']['defaultCharacterDisplay'] },
    addToast: () => {},
    ...overrides,
  };
}

const entry = (over: Partial<MemoEntry> = {}): MemoEntry =>
  ({ id: 'e1', panel: 'free', characterTags: [], ...over }) as MemoEntry;

/** 先頭アイテムの label を取り出す（区切り等を除いた menu item 前提）。 */
const labelOf = (entries: Parameters<typeof buildDeleteItems>[0], ctx: MenuContext) =>
  (buildDeleteItems(entries, ctx)[0] as { label: string }).label;

describe('menuItems builders（t 経由）', () => {
  it('削除ラベルは単数/複数でキーを切り替える', () => {
    expect(labelOf([entry()], makeCtx())).toBe('menus.delete');
    expect(labelOf([entry(), entry({ id: 'e2' })], makeCtx())).toBe('menus.deleteBulk:2');
  });

  it('移動サブメニューのトップは move キー', () => {
    const items = buildMoveSubmenu([entry()], makeCtx());
    expect((items[0] as { label: string }).label).toBe('menus.move');
  });
});
