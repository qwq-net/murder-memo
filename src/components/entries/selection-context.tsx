import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface SelectionState {
  selectedIds: Set<string>;
  lastClickedId: string | null;
  /** エントリをShift+クリックで選択/選択解除。範囲選択対応 */
  handleSelect: (id: string, shiftKey: boolean, allIds: string[]) => void;
  /** 選択をすべて解除 */
  clearSelection: () => void;
  /** 選択中かどうか */
  isSelected: (id: string) => boolean;
  /** 1つ以上選択されているか */
  hasSelection: boolean;
}

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  const handleSelect = useCallback((id: string, shiftKey: boolean, allIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (shiftKey && prev.has(id)) {
        // Shift + 選択済みをクリック → 選択解除
        next.delete(id);
        // lastClickedは更新しない（範囲選択の起点を維持）
        return next;
      }

      if (shiftKey && lastClickedRef.current) {
        // Shift + 未選択をクリック → 範囲選択
        const lastIdx = allIds.indexOf(lastClickedRef.current);
        const curIdx = allIds.indexOf(id);
        if (lastIdx !== -1 && curIdx !== -1) {
          const start = Math.min(lastIdx, curIdx);
          const end = Math.max(lastIdx, curIdx);
          for (let i = start; i <= end; i++) {
            next.add(allIds[i]);
          }
        }
      } else {
        // Shift + 起点なし → 単体選択
        next.add(id);
      }

      lastClickedRef.current = id;
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedRef.current = null;
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const value = useMemo<SelectionState>(() => ({
    selectedIds,
    lastClickedId: lastClickedRef.current,
    handleSelect,
    clearSelection,
    isSelected,
    hasSelection: selectedIds.size > 0,
  }), [selectedIds, handleSelect, clearSelection, isSelected]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}
