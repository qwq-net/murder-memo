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
import { useCallback, useMemo, useRef, useState } from 'react';

import { useStore } from '@/store';
import type { Character, CharacterRole } from '@/types/memo';
import { ModalFrame } from '@/components/common/modalFrame';
import { RadioGroup } from '@/components/common/radioGroup';
import { X } from '@/components/icons';
import { CharacterColorPalette } from '@/components/characters/characterColorPalette';

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
  const addToast = useStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<CharacterRole>('pl');
  const [newName, setNewName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const plChars = useMemo(
    () => characters.filter((c) => c.role === 'pl').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );
  const npcChars = useMemo(
    () => characters.filter((c) => c.role === 'npc').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );
  const activeChars = activeTab === 'pl' ? plChars : npcChars;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const list = activeChars;
      const oldIndex = list.findIndex((c) => c.id === active.id);
      const newIndex = list.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(list, oldIndex, newIndex);
      // 同ロール内だけ reorder — 他ロールのキャラはそのまま
      const otherChars = characters.filter((c) => c.role !== activeTab);
      const allOrdered = [...reordered, ...otherChars];
      reorderCharacters(allOrdered.map((c) => c.id));
    },
    [activeChars, activeTab, characters, reorderCharacters],
  );

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    const usedColors = new Set(characters.map((c) => c.color));
    const nextColor = DEFAULT_COLORS.find((c) => !usedColors.has(c)) ?? '#888888';
    await addCharacter({ name, color: nextColor, role: activeTab, showInEntries: true });
    addToast('登場人物を追加しました');
    setNewName('');
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [newName, characters, addCharacter, activeTab, addToast]);

  const tabStyle = (tab: CharacterRole): React.CSSProperties => ({
    flex: 1,
    background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--color-settings-accent)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
    fontSize: 13,
    fontWeight: activeTab === tab ? 600 : 400,
    padding: '8px 0',
    cursor: 'pointer',
    transition: 'color 0.12s, border-color 0.12s',
    letterSpacing: '0.06em',
  });

  return (
    <ModalFrame
      open={isOpen}
      onClose={() => setOpen(false)}
      width={480}
      ariaLabel="登場人物設定"
    >
      {/* ModalFrame の overflowY: auto 内で、ヘッダー/タブ固定 + リスト部スクロールを実現 */}
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(80vh - 2px)', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
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
          <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            ドラッグで行動順を変更
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="閉じる"
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* PL / NPC タブ */}
        <div
          role="tablist"
          aria-label="キャラクタータイプ"
          style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}
        >
          <button role="tab" aria-selected={activeTab === 'pl'} id="tab-pl" aria-controls="tabpanel-characters" onClick={() => setActiveTab('pl')} style={tabStyle('pl')}>
            PL（{plChars.length}）
          </button>
          <button role="tab" aria-selected={activeTab === 'npc'} id="tab-npc" aria-controls="tabpanel-characters" onClick={() => setActiveTab('npc')} style={tabStyle('npc')}>
            NPC（{npcChars.length}）
          </button>
        </div>

        {/* Character list */}
        <div role="tabpanel" id="tabpanel-characters" aria-labelledby={`tab-${activeTab}`} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {activeChars.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                color: 'var(--text-faint)',
                fontSize: 13,
              }}
            >
              {activeTab === 'pl' ? 'PLを追加してください' : 'NPCを追加してください'}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeChars.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {activeChars.map((char, i) => (
                <SortableCharacterRow
                  key={char.id}
                  char={char}
                  isLast={i === activeChars.length - 1}
                  onUpdate={updateCharacter}
                  onRemove={(id) => { removeCharacter(id); addToast('登場人物を削除しました'); }}
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
            padding: '10px 18px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
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
            placeholder={activeTab === 'pl' ? 'PL名を入力' : 'NPC名を入力'}
            aria-label="登場人物の名前"
            className="input-base"
            style={{ flex: 1, padding: '6px 10px' }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="btn-primary btn-lg"
          >
            追加
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

// ─── Sortable Character Row ──────────────────────────────────────────────────

function SortableCharacterRow({
  char,
  isLast,
  onUpdate,
  onRemove,
}: {
  char: Character;
  isLast: boolean;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: char.id });

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
        char={char}
        isLast={isLast}
        dragHandleProps={{ ...attributes, ...listeners }}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
}

// ─── Character Row ──────────────────────────────────────────────────────────

function CharacterRow({
  char,
  isLast,
  dragHandleProps,
  onUpdate,
  onRemove,
}: {
  char: Character;
  isLast: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localName, setLocalName] = useState(char.name);
  const [prevCharName, setPrevCharName] = useState(char.name);
  const composingRef = useRef(false);

  // char.name は blur 時にのみ更新されるため、IME composition 中には変わらない
  if (char.name !== prevCharName) {
    setPrevCharName(char.name);
    setLocalName(char.name);
  }

  return (
    <div
      style={{
        padding: '6px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
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
            background: char.color,
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
            onUpdate(char.id, { name: e.currentTarget.value });
          }}
          onBlur={(e) => {
            if (!composingRef.current) {
              onUpdate(char.id, { name: e.currentTarget.value.trim() || char.name });
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

        {/* エントリ表示トグル */}
        <RadioGroup
          options={[
            { value: 'show', label: '表示' },
            { value: 'hide', label: '非表示' },
          ]}
          value={char.showInEntries ? 'show' : 'hide'}
          onChange={(v: string) => onUpdate(char.id, { showInEntries: v === 'show' })}
        />

        {/* Delete */}
        <button
          onClick={() => onRemove(char.id)}
          aria-label={`${char.name}を削除`}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Expanded: color palette */}
      {expanded && (
        <div style={{ padding: '8px 0 4px 42px' }}>
          <CharacterColorPalette value={char.color} onChange={(c) => onUpdate(char.id, { color: c })} />
        </div>
      )}
    </div>
  );
}
