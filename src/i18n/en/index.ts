/**
 * 英語メッセージカタログ。各名前空間ファイルは Messages['ns'] 型に束縛され、
 * キーの欠落・余剰・型ミスはコンパイルエラーになる。
 *
 * 用語は英語圏のマーダーミステリー（"murder mystery game"）で通じる訳を採用:
 *   推理メモ=Deductions / 相関図=Relationship Chart / 疑惑度=Suspicion / 犯人=Culprit など。
 */
import type { Messages } from '@/lib/i18n';

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

export const en: Messages = {
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
};
