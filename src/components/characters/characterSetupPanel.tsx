import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useMemo, useRef, useState } from 'react';

import { CharacterRowView } from '@/components/characters/characterRowView';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';
import { useT } from '@/i18n';
import { splitCharactersByRole } from '@/lib/characterSort';
import { useStore } from '@/store';
import type { Character, CharacterRole } from '@/types/memo';

const DEFAULT_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f1c40f',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#e91e8c',
  '#607d8b',
];

export function CharacterSetupPanel() {
  const t = useT();
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

  const { plChars, npcChars } = useMemo(() => splitCharactersByRole(characters), [characters]);
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
    addToast(t('characters.toasts.added'));
    setNewName('');
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [newName, characters, addCharacter, activeTab, addToast, t]);

  const tabStyle = (tab: CharacterRole): React.CSSProperties => ({
    flex: 1,
    background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
    border: 'none',
    borderBottom:
      activeTab === tab ? '2px solid var(--color-settings-accent)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
    fontSize: 14,
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
      ariaLabel={t('characters.heading')}
    >
      {/* ModalFrame の overflowY: auto 内で、ヘッダー/タブ固定 + リスト部スクロールを実現 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(80vh - 2px)',
          overflow: 'hidden',
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
            {t('characters.heading')}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-faint)' }}>
            {t('characters.reorderHint')}
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* プレイヤー / NPC タブ */}
        <div
          role="tablist"
          aria-label={t('characters.tabs.typeList')}
          style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'pl'}
            id="tab-pl"
            aria-controls="tabpanel-characters"
            onClick={() => setActiveTab('pl')}
            style={tabStyle('pl')}
          >
            {t('characters.tabs.pl', { n: plChars.length })}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'npc'}
            id="tab-npc"
            aria-controls="tabpanel-characters"
            onClick={() => setActiveTab('npc')}
            style={tabStyle('npc')}
          >
            {t('characters.tabs.npc', { n: npcChars.length })}
          </button>
        </div>

        {/* Character list */}
        <div
          role="tabpanel"
          id="tabpanel-characters"
          aria-labelledby={`tab-${activeTab}`}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {activeChars.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                color: 'var(--text-faint)',
                fontSize: 14,
              }}
            >
              {activeTab === 'pl' ? t('characters.empty.pl') : t('characters.empty.npc')}
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
                  onRemove={(id) => {
                    removeCharacter(id);
                    addToast(t('characters.toasts.removed'));
                  }}
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
            placeholder={
              activeTab === 'pl'
                ? t('characters.add.placeholderPl')
                : t('characters.add.placeholderNpc')
            }
            aria-label={t('characters.add.nameLabel')}
            className="input-base"
            style={{ flex: 1, padding: '6px 10px' }}
          />
          <button onClick={handleAdd} disabled={!newName.trim()} className="btn-primary btn-lg">
            {t('common.add')}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: char.id,
  });

  const transformStyle = transform ? `translate3d(0, ${transform.y}px, 0)` : undefined;

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
      <CharacterRowView
        char={char}
        isLast={isLast}
        dragHandleProps={{ ...attributes, ...listeners }}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
}
