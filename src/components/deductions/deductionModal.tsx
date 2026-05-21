import { useCallback, useMemo } from 'react';

import { ModalFrame } from '@/components/common/modalFrame';
import { DeductionRowView, type SuspicionLevel } from '@/components/deductions/deductionRowView';
import { X } from '@/components/icons';
import { useStore } from '@/store';

/**
 * キャラクター 1 行分。store から該当キャラの推理メモを取得し、
 * `DeductionRowView` に値・ハンドラを流す薄ラッパー。
 */
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

  const deduction = useMemo(
    () => deductions.find((d) => d.characterId === characterId),
    [deductions, characterId],
  );

  const suspicionLevel: SuspicionLevel = (deduction?.suspicionLevel as SuspicionLevel) ?? 0;
  const memo = deduction?.memo ?? '';

  const handleLevelChange = useCallback(
    (level: SuspicionLevel) => upsertDeduction(characterId, { suspicionLevel: level }),
    [characterId, upsertDeduction],
  );
  const handleMemoChange = useCallback(
    (next: string) => upsertDeduction(characterId, { memo: next }),
    [characterId, upsertDeduction],
  );

  return (
    <DeductionRowView
      characterName={characterName}
      characterColor={characterColor}
      suspicionLevel={suspicionLevel}
      memo={memo}
      onChangeLevel={handleLevelChange}
      onChangeMemo={handleMemoChange}
    />
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
    <ModalFrame open={isOpen} onClose={() => setOpen(false)} width={440} ariaLabel="人物推理メモ">
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
