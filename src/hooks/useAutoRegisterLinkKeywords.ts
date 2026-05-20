import { useCallback } from 'react';

import { extractBracketedWords } from '@/lib/linkKeywords';
import { useStore } from '@/store';

/**
 * メモ確定時、テキスト中の `[キーワード]` をリンクキーワード辞書に
 * 自動登録するためのカスタムフック。
 *
 * 戻り値はテキストを 1 引数で受け取る登録関数。エントリ系コンポーネントの
 * `onSave` コールバックの直前で呼び出すことで、同じロジックを各コンポーネントに
 * 書き写す必要がなくなる。
 *
 * 既に登録済みのキーワードや、抽出ワードが空の場合は何もしない（無駄な IDB 書き込みを避ける）。
 * 永続化エラーは握りつぶさず console.error にログ出力する。
 */
export function useAutoRegisterLinkKeywords(): (text: string) => void {
  const addLinkKeywords = useStore((s) => s.addLinkKeywords);

  return useCallback(
    (text: string) => {
      const words = extractBracketedWords(text);
      if (words.length === 0) return;
      addLinkKeywords(words).catch((err) => {
        console.error('リンクキーワードの自動登録に失敗しました', err);
      });
    },
    [addLinkKeywords],
  );
}
