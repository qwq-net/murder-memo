import { useEffect, useRef, useState } from 'react';

/**
 * 渡された ID リストに対応する DOM 要素を IntersectionObserver で監視し、
 * 「現在画面に入っている中でドキュメント順の最初のもの」の ID を返す。
 *
 * Guide ページのサイド目次ハイライト用。スクロールに応じて active な section を切り替える。
 *
 * @param ids 監視対象の要素 ID リスト（ドキュメント順に並んでいる前提）
 * @returns 現在 active な ID。初期状態（まだどれも可視になっていない）では null。
 *
 * 挙動の注意:
 * - 一度 active が決まると、全セクションが判定域外になっても null には戻さず直前の値を保持する
 *   （スクロールで見出しハイライトが消えないようにするため）
 * - SSG 環境では実行されない（useEffect 内で `document` を参照するため、初期値は null のまま）
 * - ids は呼び手側で安定参照にしないと、配列が毎レンダー新規生成されるたびに observer が再構築される
 */
export function useActiveSection(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  // 「現在画面に入っている」フラグを ID 別に保持。observer のたびに更新する
  const visibleMapRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    visibleMapRef.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleMapRef.current[entry.target.id] = entry.isIntersecting;
        }
        // ids 順（=ドキュメント順）の最初の可視 ID を active にする
        const firstVisible = ids.find((id) => visibleMapRef.current[id]);
        if (firstVisible) {
          setActiveId(firstVisible);
        }
      },
      {
        // sticky ヘッダー (44px) + 上方バッファを差し引き、画面下半分を判定対象外にすることで
        // 「セクションが画面の上 1/3 あたりに来た」タイミングで active 切替させる
        rootMargin: '-60px 0px -60% 0px',
        threshold: 0,
      },
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
