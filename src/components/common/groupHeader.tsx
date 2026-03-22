import { useState } from 'react';

import type { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import type { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';
import { ArrowDown, ArrowUp, ChevronDown, SquarePen, X } from '@/components/icons';
import { ConfirmModal } from '@/components/common/confirmModal';

interface GroupHeaderProps {
  /** グループラベル */
  label: string;
  /** 折りたたみ状態 */
  collapsed: boolean;
  /** アクセント色（CSS変数 or 色値） */
  accentColor: string;
  /** 折りたたみトグル */
  onToggle: () => void;
  /** useGroupLabelEditor の戻り値 */
  labelEditor: ReturnType<typeof useGroupLabelEditor>;
  /** useDeleteWithConfirmation の戻り値 */
  deleteConfirm: ReturnType<typeof useDeleteWithConfirmation>;
  /** 上に移動（undefined = 先頭） */
  onMoveUp?: () => void;
  /** 下に移動（undefined = 末尾） */
  onMoveDown?: () => void;
  /** 削除確認モーダルの設定 */
  deleteModal: {
    title: string;
    confirmationLabel: string;
  };
}

/**
 * グループヘッダーの共通コンポーネント。
 * MemoGroupSection と TimelineGroupSection で共用する。
 */
export function GroupHeader({
  label,
  collapsed,
  accentColor,
  onToggle,
  labelEditor,
  deleteConfirm,
  onMoveUp,
  onMoveDown,
  deleteModal,
}: GroupHeaderProps) {
  const [headerHovered, setHeaderHovered] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        onClick={labelEditor.isEditing ? undefined : onToggle}
        className="flex items-center gap-2 px-2.5 py-[7px] cursor-pointer select-none"
        style={{
          background: `color-mix(in srgb, ${accentColor} 5%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${accentColor} 12%, transparent)`,
        }}
      >
        {/* 折りたたみ矢印 */}
        <span
          className="flex items-center shrink-0 transition-transform duration-150"
          style={{
            color: accentColor,
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown size={12} />
        </span>

        {/* ラベル */}
        {labelEditor.isEditing ? (
          <input
            autoFocus
            value={labelEditor.draftLabel}
            onChange={(e) => labelEditor.setDraftLabel(e.target.value)}
            onBlur={labelEditor.saveLabel}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={labelEditor.handleKeyDown}
            aria-label="グループ名を編集"
            className="flex-1 bg-bg-base rounded-sm text-sm font-semibold px-1.5 py-px outline-none"
            style={{
              border: `1px solid ${accentColor}`,
              color: accentColor,
            }}
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold tracking-[0.06em]"
            style={{ color: accentColor }}
          >
            {label}
          </span>
        )}

        {/* 並び替え矢印 — ホバー時表示 */}
        {!labelEditor.isEditing && (onMoveUp || onMoveDown) && (
          <span
            className="flex items-center gap-px"
            style={{ opacity: headerHovered ? 0.8 : 0, transition: 'opacity 0.15s' }}
          >
            <button
              disabled={!onMoveUp}
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              aria-label={`${label}を上に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveUp ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveUp) e.currentTarget.style.color = accentColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowUp size={14} />
            </button>
            <button
              disabled={!onMoveDown}
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              aria-label={`${label}を下に移動`}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center transition-colors duration-150"
              style={{ color: 'var(--text-faint)', opacity: onMoveDown ? 1 : 0.3 }}
              onMouseEnter={(e) => { if (onMoveDown) e.currentTarget.style.color = accentColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
            >
              <ArrowDown size={14} />
            </button>
          </span>
        )}

        {/* 編集ボタン — ホバー時表示 */}
        {!labelEditor.isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              labelEditor.startEditing();
            }}
            title="グループ名を変更"
            aria-label={`${label}の名前を変更`}
            className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
            style={{
              opacity: headerHovered ? 0.8 : 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
          >
            <SquarePen size={14} />
          </button>
        )}

        {/* 削除ボタン — ホバー時表示 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteConfirm.requestDelete();
          }}
          title="グループを削除"
          aria-label={`${label}を削除`}
          className="bg-transparent border-none text-text-faint cursor-pointer px-0.5 flex items-center transition-[color,opacity] duration-150"
          style={{
            opacity: headerHovered ? 1 : 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        open={deleteConfirm.isModalOpen}
        onClose={deleteConfirm.closeModal}
        title={deleteModal.title}
        confirmationLabel={deleteModal.confirmationLabel}
        actions={[
          {
            label: '削除',
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: deleteConfirm.executeDelete,
          },
        ]}
      />
    </>
  );
}
