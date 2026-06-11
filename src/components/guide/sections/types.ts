/**
 * 使い方ガイドのセクション定義の共通型。
 *
 * NOTE: SSG 評価対象なので `@/store`, `@/lib/idb`, `@dnd-kit/*` 系の重量級 import は禁止。
 */
import type { ReactNode } from 'react';

/** ガイド1セクション分の定義（目次と本文の単一ソース） */
export interface GuideSection {
  id: string;
  /** 目次・見出しに使うタイトル */
  title: string;
  content: ReactNode;
}
