import { useCallback, useMemo } from 'react';

import { ModalEmptyMessage } from '@/components/common/modalEmptyMessage';
import { ModalFrame } from '@/components/common/modalFrame';
import { ModalHeader } from '@/components/common/modalHeader';
import { DeductionRowView, type SuspicionLevel } from '@/components/deductions/deductionRowView';
import { splitCharactersByRole } from '@/lib/characterSort';
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
  // 該当キャラの推理メモのみ購読（find は既存オブジェクト参照を返すため、
  // 他キャラの変更ではこの行は再レンダーされない）
  const deduction = useStore((s) => s.deductions.find((d) => d.characterId === characterId));
  const upsertDeduction = useStore((s) => s.upsertDeduction);

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

  const { plChars, npcChars } = useMemo(() => splitCharactersByRole(characters), [characters]);

  return (
    <ModalFrame open={isOpen} onClose={() => setOpen(false)} width={440} ariaLabel="人物推理メモ">
      {/* ヘッダー */}
      <ModalHeader title="推理メモ" onClose={() => setOpen(false)} />

      {/* ボディ */}
      <div style={{ padding: '4px 18px 18px' }}>
        {characters.length === 0 ? (
          <ModalEmptyMessage>登場人物が設定されていません</ModalEmptyMessage>
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
