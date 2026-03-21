import { autoCompleteTime, getHourKey, getHourLabel, normalizeTimeInput, parseEventTime } from '../timeParser';

describe('normalizeTimeInput', () => {
  it('全角数字を半角に変換する', () => {
    expect(normalizeTimeInput('１３：００')).toBe('13:00');
  });

  it('全角コロンを半角に変換する', () => {
    expect(normalizeTimeInput('12：30')).toBe('12:30');
  });

  it('混合入力を正規化する', () => {
    expect(normalizeTimeInput('１2:３0')).toBe('12:30');
  });

  it('半角入力はそのまま返す', () => {
    expect(normalizeTimeInput('9:00')).toBe('9:00');
  });
});

describe('autoCompleteTime', () => {
  it('1桁 → H:00', () => {
    expect(autoCompleteTime('9')).toBe('9:00');
  });

  it('2桁 → HH:00', () => {
    expect(autoCompleteTime('13')).toBe('13:00');
  });

  it('3桁 → H:MM', () => {
    expect(autoCompleteTime('130')).toBe('1:30');
    expect(autoCompleteTime('800')).toBe('8:00');
  });

  it('4桁 → HH:MM', () => {
    expect(autoCompleteTime('1300')).toBe('13:00');
  });

  it('既にコロンがある場合はそのまま', () => {
    expect(autoCompleteTime('12:30')).toBe('12:30');
  });

  it('空文字はそのまま', () => {
    expect(autoCompleteTime('')).toBe('');
  });

  it('非数字はそのまま', () => {
    expect(autoCompleteTime('abc')).toBe('abc');
  });

  it('全角入力も正規化してから補完する', () => {
    expect(autoCompleteTime('１３００')).toBe('13:00');
  });
});

describe('parseEventTime', () => {
  it('正常な HH:MM を分換算で返す', () => {
    expect(parseEventTime('12:30')).toBe(750);
    expect(parseEventTime('0:00')).toBe(0);
    expect(parseEventTime('23:59')).toBe(1439);
  });

  it('1桁時間も受け付ける', () => {
    expect(parseEventTime('9:00')).toBe(540);
  });

  it('不正な形式は undefined', () => {
    expect(parseEventTime('abc')).toBeUndefined();
    expect(parseEventTime('25:00')).toBeUndefined();
    expect(parseEventTime('12:60')).toBeUndefined();
    expect(parseEventTime('1200')).toBeUndefined();
  });

  it('空文字は undefined', () => {
    expect(parseEventTime('')).toBeUndefined();
    expect(parseEventTime('  ')).toBeUndefined();
  });
});

describe('getHourLabel', () => {
  it('ソートキーから時間帯ラベルを返す', () => {
    expect(getHourLabel(720)).toBe('12:00');
    expect(getHourLabel(0)).toBe('0:00');
    expect(getHourLabel(750)).toBe('12:00');
  });
});

describe('getHourKey', () => {
  it('ソートキーから時間帯番号を返す', () => {
    expect(getHourKey(750)).toBe(12);
    expect(getHourKey(0)).toBe(0);
    expect(getHourKey(1439)).toBe(23);
  });
});
