/**
 * パネルヘッダーに表示する重要度の絞り込みバー（store 連携版）。
 *
 * 表示は `ImportanceFilterBarView` に委譲し、ここでは store から値・ハンドラを取得する。
 * 選択した重要度レベルのエントリのみ表示する（複数レベルは OR、キャラクターフィルターとは
 * AND。判定ロジックは src/lib/entryFilter.ts に集約）。
 */
import { ImportanceFilterBarView } from '@/components/entries/importanceFilterBarView';
import { useStore } from '@/store';
import type { PanelId } from '@/types/memo';

interface ImportanceFilterBarProps {
  panelId: PanelId;
}

export function ImportanceFilterBar({ panelId }: ImportanceFilterBarProps) {
  const importanceLevels = useStore((s) => s.importanceFilter[panelId]);
  const toggleImportanceFilter = useStore((s) => s.toggleImportanceFilter);
  const clearImportanceFilter = useStore((s) => s.clearImportanceFilter);

  return (
    <ImportanceFilterBarView
      activeLevels={importanceLevels}
      onToggle={(level) => toggleImportanceFilter(panelId, level)}
      onClear={() => clearImportanceFilter(panelId)}
    />
  );
}
