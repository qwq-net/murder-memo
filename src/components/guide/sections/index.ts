/**
 * 使い方ガイド本文の全セクション定義（目次と本文の単一ソース）。
 *
 * 構成は「利用フロー順」に再編：はじめに → セッション → 登場人物 → パネル → エントリ →
 * （メモ取り系） → 推理系 → エクスポート → リファレンスの 14 セクション。
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
import { basicsSections } from './basicsSections';
import { entrySections } from './entrySections';
import { referenceSections } from './referenceSections';
import { researchSections } from './researchSections';
import type { GuideSection } from './types';

export type { GuideSection } from './types';

/** ガイドの全 14 セクション（表示順。テーマ別の 4 配列を結合する） */
export const GUIDE_SECTIONS: GuideSection[] = [
  ...basicsSections,
  ...entrySections,
  ...researchSections,
  ...referenceSections,
];
