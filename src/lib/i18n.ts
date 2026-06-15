/**
 * 軽量・自前の i18n エンジン（新規 npm 依存ゼロ）。
 *
 * - カタログ（src/i18n/ja.ts, en.ts）は機能別ネストの素の object。`ja` を source of truth とし、
 *   `en` は `Messages` 型に束縛されるため欠落・余剰・型ミスはコンパイルエラーになる。
 * - 呼び出しはドット結合キー（例: `t('panels.free')`）。`MessageKey` を `ja` から再帰導出するため
 *   call site で補完が効き、typo は型エラーになる。
 * - フォールバック: en に無いキーは ja 値 → それも無ければキー文字列そのもの。
 *   これで段階移行中もアプリは壊れず、未翻訳は日本語表示、真の欠落はキーが見えて検知できる。
 *
 * ロジックは純粋関数として本ファイル（src/lib/）に置き、React 連携（useT / getT）は src/i18n/index.ts。
 */

import { en } from '@/i18n/en';
import { ja } from '@/i18n/ja';

export type Lang = 'ja' | 'en';

/** 複数形を持つメッセージ値（英語の one/other 用。日本語は one===other 同内容で揃える）。 */
export interface PluralValue {
  one: string;
  other: string;
}

/** カタログの葉ノード: 平文 string か複数形オブジェクト。 */
export type MessageValue = string | PluralValue;

/**
 * `ja` の構造から「同形」を要求する型。`en` をこれに束縛して欠落/余剰/型ミスを検出する。
 * 葉が string なら string、複数形なら PluralValue、それ以外（中間ノード）は再帰。
 * トップ階層のマップと再帰を分離して TS の型インスタンス化深度の暴走（TS2589）を避ける。
 */
export type Messages = { [K in keyof typeof ja]: WidenNode<(typeof ja)[K]> };
type WidenNode<T> = T extends string
  ? string
  : T extends PluralValue
    ? PluralValue
    : { [K in keyof T]: WidenNode<T[K]> };

/** `ja` の葉をドット結合したキーのユニオン（例: 'panels.free' | 'menus.format.full' …）。 */
export type MessageKey = { [K in keyof typeof ja & string]: KeyPath<K, (typeof ja)[K]> }[keyof typeof ja & string];
type KeyPath<K extends string, T> = T extends string
  ? K
  : T extends PluralValue
    ? K
    : { [K2 in keyof T & string]: KeyPath<`${K}.${K2}`, T[K2]> }[keyof T & string];

/** 補間パラメータ。`n` は複数形選択に使われる予約名。 */
export interface TParams {
  n?: number;
  [key: string]: string | number | undefined;
}

export type TFunc = (key: MessageKey, params?: TParams) => string;

const CATALOGS: Record<Lang, Messages> = { ja, en };

/**
 * ドットキー（例: 'menus.format.full'）でカタログを辿り、葉のメッセージ値を返す。
 *
 * @returns 葉に到達したときだけ string か PluralValue を返す。経路の途中で
 *          キーが欠落した場合、または葉ではなく中間ノードで止まった場合は undefined
 *          （makeT のフォールバック連鎖の分岐点になる）。
 */
function lookup(catalog: unknown, key: string): MessageValue | undefined {
  let cur: unknown = catalog;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (typeof cur === 'string') return cur;
  if (
    cur != null &&
    typeof cur === 'object' &&
    typeof (cur as PluralValue).one === 'string' &&
    typeof (cur as PluralValue).other === 'string'
  ) {
    return cur as PluralValue;
  }
  return undefined;
}

/**
 * `{name}` / `{n}` 形のプレースホルダを params の同名の値で置換する。
 *
 * @param params 省略時はテンプレートを無変換で返す。値が null / undefined のキーは
 *               置換せずプレースホルダを残す（`{n}` に 0 を渡した場合は "0" に置換される）。
 *               params に存在しないプレースホルダもそのまま残す。
 */
export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] != null ? String(params[name]) : match,
  );
}

/**
 * メッセージ値から表示文字列を選ぶ。
 *
 * @param n 複数形ノードのときだけ参照する。n===1 で one、それ以外（0・undefined・2 以上）は other。
 * @returns string ノードは n に関係なくそのまま返す。
 */
export function pickPlural(node: MessageValue, n?: number): string {
  if (typeof node === 'string') return node;
  return n === 1 ? node.one : node.other;
}

/**
 * 指定言語の翻訳関数 t を生成する。
 *
 * 返り値 t(key, params) の解決順: 指定 lang のカタログ → 無ければ ja → それも無ければ
 * key 文字列そのものを返す（未定義キーでも throw せず、画面に key が見えて欠落を検知できる）。
 * 値が複数形なら params.n で one/other を選び、最後に params で `{...}` を補間する。
 */
export function makeT(lang: Lang): TFunc {
  const primary = CATALOGS[lang];
  return (key, params) => {
    const node = lookup(primary, key) ?? lookup(ja, key);
    if (node == null) return key;
    return interpolate(pickPlural(node, params?.n), params);
  };
}
