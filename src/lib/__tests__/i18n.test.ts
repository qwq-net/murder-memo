import { describe, expect, it } from 'vitest';

import { interpolate, makeT, pickPlural } from '@/lib/i18n';

describe('interpolate', () => {
  it('{name} / {n} を置換する', () => {
    expect(interpolate('{n}件の{label}', { n: 3, label: 'メモ' })).toBe('3件のメモ');
  });

  it('params が無ければテンプレートをそのまま返す', () => {
    expect(interpolate('変化なし')).toBe('変化なし');
  });

  it('未知プレースホルダは素通しする', () => {
    expect(interpolate('{a}/{b}', { a: 'x' })).toBe('x/{b}');
  });

  it('値が 0 でも置換される（null/undefined のみ素通し）', () => {
    expect(interpolate('{n}件', { n: 0 })).toBe('0件');
  });
});

describe('pickPlural', () => {
  it('string ノードはそのまま返す', () => {
    expect(pickPlural('そのまま', 5)).toBe('そのまま');
  });

  it('n===1 は one、それ以外は other を選ぶ', () => {
    const node = { one: 'one', other: 'other' };
    expect(pickPlural(node, 1)).toBe('one');
    expect(pickPlural(node, 2)).toBe('other');
    expect(pickPlural(node, 0)).toBe('other');
    expect(pickPlural(node, undefined)).toBe('other');
  });
});

describe('makeT', () => {
  it('言語に応じた訳を返す', () => {
    expect(makeT('ja')('panels.free')).toBe('フリーメモ');
    expect(makeT('en')('panels.free')).toBe('Free Memo');
  });

  it('複数形 + 補間（en）', () => {
    const t = makeT('en');
    expect(t('toasts.movedTo', { n: 1, label: 'Timeline' })).toBe('Moved to Timeline');
    expect(t('toasts.movedTo', { n: 3, label: 'Timeline' })).toBe('Moved 3 memos to Timeline');
  });

  it('複数形 + 補間（ja は単複同形）', () => {
    const t = makeT('ja');
    expect(t('toasts.movedTo', { n: 1, label: 'タイムライン' })).toBe('タイムラインに移動しました');
    expect(t('toasts.movedTo', { n: 3, label: 'タイムライン' })).toBe(
      '3件のメモをタイムラインに移動しました',
    );
  });

  it('ネストした葉キーを辿れる', () => {
    expect(makeT('en')('menus.format.full')).toBe('Full');
  });
});
