import { useEffect, useState } from 'react';

import { OrderBadge } from '@/components/common/orderBadge';
import { useStore } from '@/store';

/** 表示時間（フェードアウト開始まで） */
const SHOW_MS = 1400;
/** フェードアウトの所要時間（CSS transition と一致させる） */
const FADE_MS = 200;

type HintPhase = 'visible' | 'fading' | null;

/**
 * layoutOrderHintTick の発火を「表示中かどうか」に変換するフック。
 * tick が進むたびに表示を（再）開始し、SHOW_MS 後にフェードアウト → アンマウントする。
 * 連続で変更された場合は tick ごとにタイマーが張り直され、表示が延長される。
 *
 * tick 変化 → 'visible' の反映は effect 内の同期 setState ではなく render 中の状態調整で行う
 * （searchOverlay の openSyncKey と同じ既存イディオム。カスケード再レンダーを避ける）。
 */
function useOrderHintPhase(): HintPhase {
  const tick = useStore((s) => s.layoutOrderHintTick);
  const [state, setState] = useState<{ tick: number; phase: HintPhase }>({
    tick: 0,
    phase: null,
  });

  // 新しい発火を検知したら render 中に表示状態へ調整する（tick=0 は未発火）
  if (tick !== state.tick) {
    setState({ tick, phase: tick === 0 ? null : 'visible' });
  }

  useEffect(() => {
    if (state.tick === 0 || state.phase === null) return;
    // 古い tick のタイマーが新しい表示を消さないよう、発火時の tick を確認してから遷移する
    const fadeTimer = setTimeout(
      () => setState((s) => (s.tick === state.tick ? { ...s, phase: 'fading' } : s)),
      SHOW_MS,
    );
    const hideTimer = setTimeout(
      () => setState((s) => (s.tick === state.tick ? { ...s, phase: null } : s)),
      SHOW_MS + FADE_MS,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
    // phase を依存に含めると 'fading' 遷移でタイマーが破棄されて非表示に到達しなくなる。
    // タイマー一式は「発火（tick）ごとに1回」張る契約
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tick]);

  return state.phase;
}

/**
 * パネル領域の「順番ヒント」オーバーレイ。
 *
 * レイアウト編集（構造・並び順・表示切替）で配置が変わった直後に、各パネル領域全体を
 * 薄暗く覆い、中央に丸数字（並び順エディタの行頭と同じ記号）を一時表示する。
 * 「なぜこの配置順なのか」を画面上の位置で直感的に示し、並び順調整への導線にする。
 *
 * - 親（PanelContainer のパネル行 wrapper）が position 文脈を持つ前提で inset-0 に重ねる
 * - pointer-events: none — 表示中もポップオーバー操作・パネル操作を一切妨げない
 * - 装飾のみなので aria-hidden（順序情報自体は並び順エディタが提供する）
 */
export function PanelOrderHintOverlay({ orderNumber }: { orderNumber: number }) {
  const phase = useOrderHintPhase();
  if (phase === null) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        background: 'color-mix(in srgb, var(--bg-base) 55%, transparent)',
        color: 'var(--text-primary)',
        opacity: phase === 'visible' ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <OrderBadge number={orderNumber} size={44} />
    </div>
  );
}
