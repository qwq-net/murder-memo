import { useRef, useState } from 'react';

import { CharacterColorPalette } from '@/components/characters/characterColorPalette';
import { RadioGroup } from '@/components/common/radioGroup';
import type { Character } from '@/types/memo';

interface CharacterRowViewProps {
  /** 表示するキャラクター */
  char: Character;
  /** リスト末尾なら下罫線を消す */
  isLast: boolean;
  /** ドラッグハンドル用 attributes / listeners（SortableCharacterRow から渡す。Guide では省略可） */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /** プロパティ更新ハンドラ。Guide では noop で渡せる */
  onUpdate?: (id: string, patch: Partial<Character>) => void;
  /** 削除ハンドラ。Guide では noop で渡せる */
  onRemove?: (id: string) => void;
}

/**
 * 登場人物 1 行分の表示（ドラッグハンドル + 色丸 + 名前 + 表示トグル + 削除）。
 *
 * - `useStore` には触れず、props で全データを受け取る純粋表示版
 * - 色パレットの展開状態と、名前 input のローカル下書き / IME 同期は内部 state で管理
 * - DnD のラップは `SortableCharacterRow`（characterSetupPanel.tsx 内）が担当する
 */
export function CharacterRowView({
  char,
  isLast,
  dragHandleProps,
  onUpdate,
  onRemove,
}: CharacterRowViewProps) {
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
            fontSize: 14,
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

        {/* Name — IME 対応ローカルステート */}
        <input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            onUpdate?.(char.id, { name: e.currentTarget.value });
          }}
          onBlur={(e) => {
            if (!composingRef.current) {
              onUpdate?.(char.id, { name: e.currentTarget.value.trim() || char.name });
            }
          }}
          aria-label="登場人物の名前"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
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
          onChange={(v: string) => onUpdate?.(char.id, { showInEntries: v === 'show' })}
        />

        {/* Delete */}
        <button
          onClick={() => onRemove?.(char.id)}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-faint)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line
              x1="4"
              y1="4"
              x2="12"
              y2="12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="4"
              x2="4"
              y2="12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Expanded: color palette */}
      {expanded && (
        <div style={{ padding: '8px 0 4px 42px' }}>
          <CharacterColorPalette
            value={char.color}
            onChange={(c) => onUpdate?.(char.id, { color: c })}
          />
        </div>
      )}
    </div>
  );
}
