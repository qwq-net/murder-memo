import { ConfirmModal } from '@/components/common/confirmModal';
import { GroupHeaderView } from '@/components/common/groupHeaderView';
import { useT } from '@/i18n';
import type { useDeleteWithConfirmation } from '@/hooks/useDeleteWithConfirmation';
import type { useGroupLabelEditor } from '@/hooks/useGroupLabelEditor';

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
 * グループヘッダーの店長ラッパー。
 *
 * `MemoGroupSection` と `TimelineGroupSection` で共用する。表示は `GroupHeaderView` に委譲し、
 * ここでは hook の戻り値（編集状態 / 削除確認）と `ConfirmModal` を組み合わせる責務だけを持つ。
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
  const t = useT();
  return (
    <>
      <GroupHeaderView
        label={label}
        collapsed={collapsed}
        accentColor={accentColor}
        onToggle={onToggle}
        isEditing={labelEditor.isEditing}
        draftLabel={labelEditor.draftLabel}
        onDraftChange={labelEditor.setDraftLabel}
        onSave={labelEditor.saveLabel}
        onStartEditing={labelEditor.startEditing}
        onLabelKeyDown={labelEditor.handleKeyDown}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRequestDelete={deleteConfirm.requestDelete}
      />

      {/* 削除確認モーダル */}
      <ConfirmModal
        open={deleteConfirm.isModalOpen}
        onClose={deleteConfirm.closeModal}
        title={deleteModal.title}
        confirmationLabel={deleteModal.confirmationLabel}
        actions={[
          {
            label: t('common.delete'),
            color: 'var(--danger)',
            requiresConfirmation: true,
            onClick: deleteConfirm.executeDelete,
          },
        ]}
      />
    </>
  );
}
