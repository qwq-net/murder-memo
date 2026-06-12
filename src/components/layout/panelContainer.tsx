import { useCallback, useRef } from 'react';

import { PanelOrderHintOverlay } from '@/components/layout/panelOrderHintOverlay';
import { ResizeHandle } from '@/components/layout/resizeHandle';
import { resizeColumns, resizeRows, visiblePanels } from '@/lib/panelLayout';
import { useStore } from '@/store';
import { selectResolvedLayout } from '@/store/selectors';
import type { PanelId } from '@/types/memo';

interface PanelContainerProps {
  /** 表示パネルの描画ノード。レイアウト（columns）に現れるパネルの分だけ参照される */
  panels: Partial<Record<PanelId, React.ReactNode>>;
}

// index.css の --resize-w と一致させる
const HANDLE_PX = 5;

/**
 * デスクトップのパネル配置コンテナ。解決済みレイアウト（selectResolvedLayout）の
 * カラムツリーを描画する: カラム（flex row）→ カラム内の段（flex col、最大2段）。
 *
 * リサイズはドラッグ中 layoutDraft（メモリのみ）を毎 mousemove 更新し、
 * mouseup の onCommit で所有レイヤー（セッション or グローバル設定）へ1回だけ永続化する。
 */
export function PanelContainer({ panels }: PanelContainerProps) {
  const layout = useStore(selectResolvedLayout);
  const setLayoutDraft = useStore((s) => s.setLayoutDraft);
  const commitLayoutDraft = useStore((s) => s.commitLayoutDraft);
  const containerRef = useRef<HTMLDivElement>(null);

  // 高速ドラッグ中の stale クロージャを回避するため、現在値は getState から解決する
  // （selectResolvedLayout は layoutDraft を最優先で返すので、連続ドラッグも正しく累積する）
  const handleColumnDelta = useCallback(
    (gapIndex: number, dx: number) => {
      const current = selectResolvedLayout(useStore.getState());
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth;
      const handleCount = current.columns.length - 1;
      const availableW = Math.max(1, containerW - HANDLE_PX * handleCount);
      setLayoutDraft(resizeColumns(current, gapIndex, (dx / availableW) * 100));
    },
    [setLayoutDraft],
  );

  const handleRowDelta = useCallback(
    (columnIndex: number, dy: number) => {
      const current = selectResolvedLayout(useStore.getState());
      // 2段カラムは段間ハンドル1本のみ。カラム高さ＝コンテナ高さからハンドル分を引く
      const containerH = containerRef.current?.offsetHeight ?? window.innerHeight;
      const availableH = Math.max(1, containerH - HANDLE_PX);
      setLayoutDraft(resizeRows(current, columnIndex, (dy / availableH) * 100));
    },
    [setLayoutDraft],
  );

  const handleCommit = useCallback(() => {
    void commitLayoutDraft();
  }, [commitLayoutDraft]);

  // 順番ヒント（①②③）の番号 = 表示順（左→右、カラム内は上→下）。
  // 並び順エディタ（PanelOrderEditor）の行頭バッジと同じ採番で対応づける
  const orderSeq = visiblePanels(layout);

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-1 overflow-hidden">
      {layout.columns.flatMap((column, ci) => {
        const items: React.ReactNode[] = [
          <div
            key={`col-${column.panels.join('-')}`}
            className="flex h-full min-w-0 flex-col overflow-hidden"
            style={{ flex: `${column.size} 1 0`, minWidth: 120 }}
          >
            {column.panels.flatMap((panelId, ri) => {
              const rowItems: React.ReactNode[] = [
                // min-h-0 が無いと flex 子の min-height:auto により内部スクロールが壊れて
                // カラム全体が伸びる（CLAUDE.md の flex 潰れ注意の縦方向版）。
                // minHeight は段の潰れ防止の安全弁（横の minWidth: 120 と対）。
                // relative は順番ヒントオーバーレイ（inset-0）の位置文脈
                <div
                  key={panelId}
                  className="relative flex min-h-0 flex-col overflow-hidden"
                  style={{ flex: `${column.rowSizes?.[ri] ?? 100} 1 0`, minHeight: 120 }}
                >
                  {panels[panelId]}
                  <PanelOrderHintOverlay orderNumber={orderSeq.indexOf(panelId) + 1} />
                </div>,
              ];
              if (ri < column.panels.length - 1) {
                rowItems.push(
                  <ResizeHandle
                    key={`row-handle-${ci}`}
                    direction="vertical"
                    onDelta={(dy) => handleRowDelta(ci, dy)}
                    onCommit={handleCommit}
                  />,
                );
              }
              return rowItems;
            })}
          </div>,
        ];
        if (ci < layout.columns.length - 1) {
          items.push(
            <ResizeHandle
              key={`col-handle-${ci}`}
              onDelta={(dx) => handleColumnDelta(ci, dx)}
              onCommit={handleCommit}
            />,
          );
        }
        return items;
      })}
    </div>
  );
}
