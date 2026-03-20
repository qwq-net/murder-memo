import { useCallback, useMemo, useState } from 'react';

import { useStore } from '../../store';
import { EntryInput } from '../entries/EntryInput';
import { MemoGroupSection } from './MemoGroupSection';

export function PersonalMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const toggleMemoGroupCollapse = useStore((s) => s.toggleMemoGroupCollapse);
  const removeMemoGroup = useStore((s) => s.removeMemoGroup);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const reorderEntries = useStore((s) => s.reorderEntries);

  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === 'personal').sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups],
  );

  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => e.panel === 'personal')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [allEntries],
  );

  const groupedData = useMemo(() => {
    const grouped = panelGroups.map((group) => ({
      group,
      entries: entries.filter((e) => e.groupId === group.id),
    }));
    const uncategorized = entries.filter(
      (e) => !e.groupId || !panelGroups.some((g) => g.id === e.groupId),
    );
    return { grouped, uncategorized };
  }, [panelGroups, entries]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    await addMemoGroup(label, 'personal');
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, addMemoGroup]);

  const accentColor = 'var(--panel-personal-accent)';
  const hasGroups = panelGroups.length > 0;
  const isEmpty = entries.length === 0 && !hasGroups;

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {isEmpty ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 12,
            }}
          >
            ハンドアウトや個人情報をメモ
          </div>
        ) : hasGroups ? (
          <>
            {groupedData.uncategorized.length > 0 && (
              <MemoGroupSection
                group={null}
                entries={groupedData.uncategorized}
                accentColor={accentColor}
                onReorderEntries={(ids) => reorderEntries('personal', ids)}
              />
            )}

            {groupedData.grouped.map(({ group, entries: groupEntries }) => (
              <MemoGroupSection
                key={group.id}
                group={group}
                entries={groupEntries}
                accentColor={accentColor}
                onToggleCollapse={toggleMemoGroupCollapse}
                onRemove={removeMemoGroup}
                onUpdate={updateMemoGroup}
                onReorderEntries={(ids) => reorderEntries('personal', ids)}
              />
            ))}
          </>
        ) : (
          <MemoGroupSection
            group={null}
            entries={entries}
            accentColor={accentColor}
            onReorderEntries={(ids) => reorderEntries('personal', ids)}
          />
        )}

        {/* グループ追加 */}
        <div style={{ padding: '6px 10px 10px' }}>
          {isAddingGroup ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <input
                autoFocus
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGroup();
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
                placeholder="グループ名"
                aria-label="メモグループ名"
                style={{
                  flex: 1,
                  background: 'var(--bg-base)',
                  border: `1px solid ${accentColor}`,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  padding: '4px 8px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddGroup}
                style={{
                  background: accentColor,
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--bg-base)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                追加
              </button>
              <button
                onClick={() => {
                  setIsAddingGroup(false);
                  setNewGroupLabel('');
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingGroup(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: 12,
                padding: '5px 10px',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              グループを追加
            </button>
          )}
        </div>
      </div>
      <EntryInput panel="personal" />
    </>
  );
}
