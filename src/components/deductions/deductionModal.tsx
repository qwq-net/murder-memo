import { useCallback, useMemo, useRef } from 'react';

import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useStore } from '@/store';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';

/** 星の色 — suspicionLevel に対応 */
const STAR_COLORS = [
  'var(--text-faint)',        // 0: 未設定
  'var(--importance-low)',    // 1
  'var(--importance-medium)', // 2
  'var(--importance-high)',   // 3
] as const;

function StarRating({
  value,
  onChange,
}: {
  value: 0 | 1 | 2 | 3;
  onChange: (v: 0 | 1 | 2 | 3) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {([1, 2, 3] as const).map((level) => (
        <button
          key={level}
          onClick={() => onChange(value === level ? 0 : level)}
          title={value === level ? '解除' : `怪しさ ${level}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            fontSize: 16,
            lineHeight: 1,
            color: level <= value ? STAR_COLORS[value] : 'var(--text-faint)',
            transition: 'color 0.12s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function DeductionRow({
  characterId,
  characterName,
  characterColor,
}: {
  characterId: string;
  characterName: string;
  characterColor: string;
}) {
  const deductions = useStore((s) => s.deductions);
  const upsertDeduction = useStore((s) => s.upsertDeduction);
  const { resize } = useAutoResizeTextarea();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deduction = useMemo(
    () => deductions.find((d) => d.characterId === characterId),
    [deductions, characterId],
  );

  const suspicionLevel = deduction?.suspicionLevel ?? 0;
  const memo = deduction?.memo ?? '';

  const handleStarChange = useCallback(
    (level: 0 | 1 | 2 | 3) => {
      upsertDeduction(characterId, { suspicionLevel: level });
    },
    [characterId, upsertDeduction],
  );

  const handleMemoBlur = useCallback(() => {
    const trimmed = textareaRef.current?.value.trim() ?? '';
    if (trimmed !== memo) {
      upsertDeduction(characterId, { memo: trimmed });
    }
  }, [characterId, memo, upsertDeduction]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* キャラクター名 + 星 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: characterColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
          {characterName}
        </span>
        <StarRating value={suspicionLevel} onChange={handleStarChange} />
      </div>

      {/* メモ */}
      <textarea
        ref={textareaRef}
        defaultValue={memo}
        onBlur={handleMemoBlur}
        onChange={(e) => resize(e.target)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        rows={1}
        className="w-full bg-transparent border-none outline-none text-text-secondary text-sm leading-[1.4] p-0 ml-4 resize-none overflow-hidden"
      />
    </div>
  );
}

export function DeductionModal() {
  const isOpen = useStore((s) => s.isDeductionOpen);
  const setOpen = useStore((s) => s.setDeductionOpen);
  const characters = useStore((s) => s.characters);

  const plChars = useMemo(
    () => characters.filter((c) => c.role === 'pl').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );
  const npcChars = useMemo(
    () => characters.filter((c) => c.role === 'npc').sort((a, b) => a.sortOrder - b.sortOrder),
    [characters],
  );

  return (
    <ModalFrame
      open={isOpen}
      onClose={() => setOpen(false)}
      width={440}
      ariaLabel="人物推理メモ"
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.04em',
          }}
        >
          推理メモ
        </span>
        <button onClick={() => setOpen(false)} className="modal-close-btn" aria-label="閉じる">
          <X size={18} />
        </button>
      </div>

      {/* ボディ */}
      <div style={{ padding: '4px 18px 18px' }}>
        {characters.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            登場人物が設定されていません
          </div>
        ) : (
          <>
            {/* プレイヤー */}
            {plChars.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    padding: '10px 0 4px',
                  }}
                >
                  プレイヤー
                </div>
                {plChars.map((c) => (
                  <DeductionRow
                    key={c.id}
                    characterId={c.id}
                    characterName={c.name}
                    characterColor={c.color}
                  />
                ))}
              </div>
            )}

            {/* NPC */}
            {npcChars.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    padding: '10px 0 4px',
                  }}
                >
                  NPC
                </div>
                {npcChars.map((c) => (
                  <DeductionRow
                    key={c.id}
                    characterId={c.id}
                    characterName={c.name}
                    characterColor={c.color}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalFrame>
  );
}
