/**
 * i18n の公開面。コンポーネントは useT()、フックを呼べない箇所（lib ヘルパー・ビルダー等）は
 * 引数で t を受け渡すか、文脈が無い一時的な呼び出しのみ getT() を使う。
 */
import { useMemo } from 'react';

import { makeT, type TFunc } from '@/lib/i18n';
import { useStore } from '@/store';

export type { Lang, MessageKey, TFunc, TParams } from '@/lib/i18n';

/**
 * 現在の言語（settings.language）に追従する翻訳関数を返す。
 * language の変化で再レンダーされ、t は言語ごとに useMemo で安定参照化される。
 */
export function useT(): TFunc {
  const lang = useStore((s) => s.settings.language);
  return useMemo(() => makeT(lang), [lang]);
}

/**
 * フック外（トースト等の命令的呼び出し）から現在言語の t を得る。
 * 戻り値はモジュールスコープに保持せず、使用の瞬間に呼ぶこと（言語切替に追従しなくなるため）。
 */
export function getT(): TFunc {
  return makeT(useStore.getState().settings.language);
}
