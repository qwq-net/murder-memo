/**
 * 日本語メッセージカタログ（source of truth）。各名前空間を機能別ファイルに分割して合成する。
 * 新しい名前空間を足すときは、対応する en/ 側も同名・同形で追加すること（型 + parity テストで強制）。
 */
import { app } from './app';
import { characters } from './characters';
import { common } from './common';
import { deductions } from './deductions';
import { entries } from './entries';
import { groupHeader } from './groupHeader';
import { hooks } from './hooks';
import { layout } from './layout';
import { links } from './links';
import { menus } from './menus';
import { panels } from './panels';
import { relations } from './relations';
import { search } from './search';
import { settings } from './settings';
import { toasts } from './toasts';
import { welcome } from './welcome';

export const ja = {
  common,
  app,
  panels,
  menus,
  toasts,
  settings,
  search,
  links,
  relations,
  characters,
  deductions,
  entries,
  layout,
  groupHeader,
  hooks,
  welcome,
} as const;

export type Ja = typeof ja;
