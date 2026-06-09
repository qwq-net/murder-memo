import type { DropAnimation } from '@dnd-kit/core';
import {
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * エントリ DnD 共通の DropAnimation。drop 時に dragging 中のアイテムを透明化して
 * DragOverlay へのスナップを自然に見せる。
 */
export const entryDropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0' } },
  }),
};

/**
 * エントリ DnD 共通の sensors。
 * - PointerSensor: 8px 以上ドラッグで起動（クリック / Shift 選択との分離）
 * - KeyboardSensor: 矢印キーでの並び替えに対応
 */
export function useEntriesDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
