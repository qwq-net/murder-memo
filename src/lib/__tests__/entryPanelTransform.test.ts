import { describe, expect, it } from 'vitest';

import { timelineFieldPatch } from '../entryPanelTransform';

describe('timelineFieldPatch', () => {
  it('timeline へ移すと type=timeline・timelineGroupId・時刻を設定する', () => {
    const patch = timelineFieldPatch('timeline', {
      timelineGroupId: 'tg-1',
      eventTime: '13:00',
      eventTimeSortKey: 780,
    });
    expect(patch.type).toBe('timeline');
    expect(patch.timelineGroupId).toBe('tg-1');
    expect(patch.eventTime).toBe('13:00');
    expect(patch.eventTimeSortKey).toBe(780);
  });

  it('timeline へ移す際に時刻未指定なら時刻は undefined（両方 undefined で整合）', () => {
    const patch = timelineFieldPatch('timeline', { timelineGroupId: 'tg-1' });
    expect(patch.eventTime).toBeUndefined();
    expect(patch.eventTimeSortKey).toBeUndefined();
  });

  it('free/personal へ移すと timeline 系フィールドをすべてクリアし type を text に戻す', () => {
    for (const panel of ['free', 'personal'] as const) {
      const patch = timelineFieldPatch(panel);
      expect(patch.timelineGroupId).toBeUndefined();
      expect(patch.eventTime).toBeUndefined();
      expect(patch.eventTimeSortKey).toBeUndefined();
      // timeline を離れたら type='timeline' を残さない（カードの左バー位置が type で分岐するため）
      expect(patch.type).toBe('text');
    }
  });

  it('画像エントリ（imageBlobKey あり）が timeline を離れると type は image に戻る', () => {
    const patch = timelineFieldPatch('free', {}, { imageBlobKey: 'blob-1' });
    expect(patch.type).toBe('image');
  });
});
