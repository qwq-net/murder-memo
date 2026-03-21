import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useStore } from '../../store';
import { CharacterColorPalette } from './CharacterColorPalette';

const DEFAULT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
  '#e67e22', '#1abc9c', '#e91e8c', '#607d8b',
];

export function CharacterSetupPanel() {
  const isOpen = useStore((s) => s.isCharacterSetupOpen);
  const setOpen = useStore((s) => s.setCharacterSetupOpen);
  const characters = useStore((s) => s.characters);
  const addCharacter = useStore((s) => s.addCharacter);
  const updateCharacter = useStore((s) => s.updateCharacter);
  const removeCharacter = useStore((s) => s.removeCharacter);
  const reorderCharacters = useStore((s) => s.reorderCharacters);

  const [newName, setNewName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = characters.findIndex((c) => c.id === active.id);
      const newIndex = characters.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(characters, oldIndex, newIndex);
      reorderCharacters(reordered.map((c) => c.id));
    },
    [characters, reorderCharacters],
  );

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    const usedColors = new Set(characters.map((c) => c.color));
    const nextColor = DEFAULT_COLORS.find((c) => !usedColors.has(c)) ?? '#888888';
    await addCharacter({ name, color: nextColor });
    setNewName('');
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [newName, characters, addCharacter]);

  if (!isOpen) return null;

  const sortedChars = [...characters].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="登場人物設定"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 90vw)',
          maxHeight: '80vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            登場人物
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            ドラッグで行動順を変更
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Character list */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
          {characters.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                color: 'var(--text-faint)',
                fontSize: 12,
              }}
            >
              登場人物を追加してください
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedChars.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedChars.map((char) => (
                <SortableCharacterRow
                  key={char.id}
                  id={char.id}
                  name={char.name}
                  color={char.color}
                  onUpdate={updateCharacter}
                  onRemove={removeCharacter}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add new */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 18px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <input
            ref={nameInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="名前を入力"
            aria-label="登場人物の名前"
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '6px 10px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              background: '#c45a2a',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '6px 14px',
              cursor: newName.trim() ? 'pointer' : 'default',
              opacity: newName.trim() ? 1 : 0.4,
              transition: 'opacity 0.12s',
            }}
          >
            追加
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sortable Character Row ──────────────────────────────────────────────────

function SortableCharacterRow({
  id,
  name,
  color,
  onUpdate,
  onRemove,
}: {
  id: string;
  name: string;
  color: string;
  onUpdate: (id: string, patch: Partial<import('../../types/memo').Character>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // X軸の移動を除去してモーダルの水平スクロールバーを防止
  const transformStyle = transform
    ? `translate3d(0, ${transform.y}px, 0)`
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transformStyle,
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
    >
      <CharacterRow
        id={id}
        name={name}
        color={color}
        dragHandleProps={{ ...attributes, ...listeners }}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
}

// ─── Character Row ──────────────────────────────────────────────────────────

function CharacterRow({
  id,
  name,
  color,
  dragHandleProps,
  onUpdate,
  onRemove,
}: {
  id: string;
  name: string;
  color: string;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onUpdate: (id: string, patch: Partial<import('../../types/memo').Character>) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // ローカルステートでIME compositionを管理
  const [localName, setLocalName] = useState(name);
  const composingRef = useRef(false);

  // 外部から名前が変わった時（他操作）だけ同期
  useEffect(() => {
    if (!composingRef.current) setLocalName(name);
  }, [name]);

  return (
    <div
      style={{
        padding: '6px 18px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 36,
        }}
      >
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          aria-label="ドラッグして並び替え"
          style={{
            cursor: 'grab',
            color: 'var(--text-faint)',
            fontSize: 13,
            flexShrink: 0,
            lineHeight: 1,
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          ⠿
        </span>

        {/* Color dot — click to expand palette */}
        <button
          onClick={() => setExpanded((p) => !p)}
          aria-label="テーマカラーを変更"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: color,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />

        {/* Name — IME対応ローカルステート */}
        <input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            onUpdate(id, { name: e.currentTarget.value });
          }}
          onBlur={(e) => {
            if (!composingRef.current) {
              onUpdate(id, { name: e.currentTarget.value.trim() || name });
            }
          }}
          aria-label="登場人物の名前"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            padding: '2px 0',
          }}
        />

        {/* Delete */}
        <button
          onClick={() => onRemove(id)}
          aria-label={`${name}を削除`}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 2px',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          ×
        </button>
      </div>

      {/* Expanded: color palette */}
      {expanded && (
        <div style={{ padding: '8px 0 4px 42px' }}>
          <CharacterColorPalette value={color} onChange={(c) => onUpdate(id, { color: c })} />
        </div>
      )}
    </div>
  );
}
