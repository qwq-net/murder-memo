import { describe, expect, it } from 'vitest';

import type { MemoEntry } from '@/types/memo';
import { resolveInheritedEventTime } from '../timelineDrop';

function tlEntry(eventTime: string | undefined): MemoEntry {
  return {
    id: 'x',
    type: 'timeline',
    content: '',
    panel: 'timeline',
    characterTags: [],
    createdAt: 0,
    updatedAt: 0,
    sortOrder: 0,
    timelineGroupId: 'tg-1',
    eventTime,
    eventTimeSortKey: eventTime ? 780 : undefined,
  };
}

describe('resolveInheritedEventTime', () => {
  it('不明列へのドロップは時刻をクリアする（両方 undefined）', () => {
    const r = resolveInheritedEventTime({ hour: 'unknown', overEntry: tlEntry('13:00') });
    expect(r.eventTime).toBeUndefined();
    expect(r.eventTimeSortKey).toBeUndefined();
  });

  it('時間帯列に隣接カードがあればその時刻を継承する', () => {
    const r = resolveInheritedEventTime({ hour: 13, overEntry: tlEntry('13:30') });
    expect(r.eventTime).toBe('13:30');
    expect(r.eventTimeSortKey).toBe(13 * 60 + 30);
  });

  it('隣接カードが無い（背景ドロップ）なら時間帯の正時 H:00 をフォールバックする', () => {
    const r = resolveInheritedEventTime({ hour: 9, overEntry: null });
    expect(r.eventTime).toBe('9:00');
    expect(r.eventTimeSortKey).toBe(9 * 60);
  });

  it('継承元の時刻は resolveEventTime を通り整合する（0 時も有効）', () => {
    const r = resolveInheritedEventTime({ hour: 0, overEntry: null });
    expect(r.eventTime).toBe('0:00');
    expect(r.eventTimeSortKey).toBe(0);
  });
});
