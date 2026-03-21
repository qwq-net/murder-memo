/**
 * 全角数字・コロンを半角に変換する（入力中に使用）。
 * "１３：００" → "13:00", "１２:30" → "12:30"
 */
export function normalizeTimeInput(input: string): string {
  return input
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/：/g, ':');
}

/**
 * コロンなし数字入力を HH:MM に自動補完する（blur/submit時に使用）。
 * "1300" → "13:00", "800" → "8:00", "130" → "1:30", "9" → "9:00"
 * 既にコロンがある場合はそのまま返す。
 */
export function autoCompleteTime(input: string): string {
  const s = normalizeTimeInput(input).trim();
  if (!s || s.includes(':')) return s;

  // 数字のみの場合に補完
  if (!/^\d{1,4}$/.test(s)) return s;

  const n = s.length;
  if (n <= 2) {
    // "9" → "9:00", "13" → "13:00"
    return `${s}:00`;
  }
  if (n === 3) {
    // "130" → "1:30", "800" → "8:00"
    return `${s[0]}:${s.slice(1)}`;
  }
  // n === 4: "1300" → "13:00"
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

/**
 * HH:MM 形式の時刻文字列からソート用数値キー（分換算）を生成する。
 * "12:30" → 750, "0:00" → 0, "23:59" → 1439
 *
 * 不正な形式の場合は undefined を返す。
 */
export function parseEventTime(input: string): number | undefined {
  const s = input.trim();
  if (!s) return undefined;

  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;

  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);

  if (h < 0 || h > 23 || m < 0 || m > 59) return undefined;

  return h * 60 + m;
}

/**
 * ソートキー（分換算）から時間帯ラベルを返す。
 * 720 → "12時台"
 */
export function getHourLabel(sortKey: number): string {
  const h = Math.floor(sortKey / 60);
  return `${h}:00`;
}

/**
 * ソートキーから時間帯グループキー（時単位）を返す。
 * 750 → 12, 0 → 0
 */
export function getHourKey(sortKey: number): number {
  return Math.floor(sortKey / 60);
}
