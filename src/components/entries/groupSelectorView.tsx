import { useCallback, useState } from 'react';

import { Plus } from '@/components/icons';
import { useT } from '@/i18n';

export interface GroupSelectorGroupOption {
  /** グループ ID */
  id: string;
  /** 表示ラベル */
  label: string;
}

interface GroupSelectorViewProps {
  /** タイムラインパネル向けの表示にするか（プレースホルダ文言が変わる） */
  isTimeline: boolean;
  /** 並び替え済み・フィルタ済みのグループ候補 */
  groups: GroupSelectorGroupOption[];
  /** 現在選択中のグループ ID（候補に含まれていなければ空扱い） */
  selectedGroupId: string;
  /** select 変更ハンドラ */
  onGroupIdChange: (id: string) => void;
  /**
   * 新規グループ追加ハンドラ。
   * 戻り値が `false` ならローカル下書きをクリアしない（バリデーション失敗等を呼び出し側で扱える）。
   * Guide では noop で渡せる。
   */
  onAddGroup?: (label: string) => Promise<void> | void;
}

/**
 * グループセレクタ行の純粋表示版。
 *
 * - グループ選択 select + 「+ メモグループ」ボタン / 新規追加 input のレイアウト
 * - useStore に触れず、グループ候補と追加ハンドラを props で受ける
 * - 下書きラベル / 編集モード（input 表示）は内部 state で管理する
 */
export function GroupSelectorView({
  isTimeline,
  groups,
  selectedGroupId,
  onGroupIdChange,
  onAddGroup,
}: GroupSelectorViewProps) {
  const t = useT();
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    await onAddGroup?.(label);
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, onAddGroup]);

  return (
    <div className="flex min-h-6 items-center gap-1">
      {/* グループセレクタ */}
      <select
        value={selectedGroupId}
        onChange={(e) => onGroupIdChange(e.target.value)}
        aria-label={t('entries.group.selectLabel')}
        className="bg-bg-elevated border-border-subtle text-text-secondary flex-1 rounded-sm border px-1.5 py-[3px] text-sm outline-none"
      >
        {isTimeline ? (
          <>
            <option value="">
              {groups.length === 0 ? t('entries.group.none') : t('entries.group.selectPrompt')}
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </>
        ) : (
          <>
            <option value="">{t('common.uncategorized')}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </>
        )}
      </select>

      {/* グループ追加 */}
      {isAddingGroup ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddGroup();
              if (e.key === 'Escape') {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            onBlur={() => {
              if (!newGroupLabel.trim()) {
                setIsAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            placeholder={
              isTimeline
                ? t('entries.group.namePlaceholderTimeline')
                : t('entries.group.namePlaceholderMemo')
            }
            aria-label={t('entries.group.nameLabel')}
            className="bg-bg-base border-border-default text-text-primary min-w-[60px] flex-1 rounded-sm border px-1.5 py-[3px] text-sm outline-none"
          />
          <button onClick={handleAddGroup} className="btn-primary btn-sm text-sm">
            {t('common.add')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          title={t('entries.group.addTitle')}
          className="border-border-default text-text-muted hover:border-border-strong hover:text-text-secondary flex cursor-pointer items-center rounded-sm border border-dashed bg-transparent px-2 py-[3px] text-sm whitespace-nowrap transition-[border-color,color] duration-150"
        >
          <Plus size={12} strokeWidth={2.5} className="mr-1" />
          {t('entries.group.add')}
        </button>
      )}
    </div>
  );
}
