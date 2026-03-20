import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import { putImage } from '../../lib/idb';
import { useStore } from '../../store';
import { EntryInput } from '../entries/EntryInput';
import { MemoGroupSection } from './MemoGroupSection';

export function FreeMemoPanel() {
  const allEntries = useStore((s) => s.entries);
  const memoGroups = useStore((s) => s.memoGroups);
  const addMemoGroup = useStore((s) => s.addMemoGroup);
  const toggleMemoGroupCollapse = useStore((s) => s.toggleMemoGroupCollapse);
  const removeMemoGroup = useStore((s) => s.removeMemoGroup);
  const updateMemoGroup = useStore((s) => s.updateMemoGroup);
  const addEntry = useStore((s) => s.addEntry);
  const reorderEntries = useStore((s) => s.reorderEntries);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const panelGroups = useMemo(
    () => memoGroups.filter((g) => g.panel === 'free').sort((a, b) => a.sortOrder - b.sortOrder),
    [memoGroups],
  );

  const entries = useMemo(
    () => allEntries.filter((e) => e.panel === 'free').sort((a, b) => a.sortOrder - b.sortOrder),
    [allEntries],
  );

  // グループ化: 各グループの所属エントリ + 未分類
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

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        const blobKey = nanoid();
        await putImage(blobKey, blob);
        await addEntry({ content: '', panel: 'free', type: 'image', imageBlobKey: blobKey });
        break;
      }
    },
    [addEntry],
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleAddGroup = useCallback(async () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    await addMemoGroup(label, 'free');
    setNewGroupLabel('');
    setIsAddingGroup(false);
  }, [newGroupLabel, addMemoGroup]);

  const accentColor = 'var(--panel-free-accent)';
  const hasGroups = panelGroups.length > 0;
  const isEmpty = entries.length === 0 && !hasGroups;

  return (
    <>
      <div
        ref={scrollRef}
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
            メモを書き殴ろう
          </div>
        ) : hasGroups ? (
          <>
            {/* 未分類グループ（先頭に表示） */}
            {groupedData.uncategorized.length > 0 && (
              <MemoGroupSection
                group={null}
                entries={groupedData.uncategorized}
                accentColor={accentColor}
                onReorderEntries={(ids) => reorderEntries('free', ids)}
              />
            )}

            {/* ユーザー定義グループ */}
            {groupedData.grouped.map(({ group, entries: groupEntries }) => (
              <MemoGroupSection
                key={group.id}
                group={group}
                entries={groupEntries}
                accentColor={accentColor}
                onToggleCollapse={toggleMemoGroupCollapse}
                onRemove={removeMemoGroup}
                onUpdate={updateMemoGroup}
                onReorderEntries={(ids) => reorderEntries('free', ids)}
              />
            ))}
          </>
        ) : (
          /* グループ未作成：フラットリスト */
          <MemoGroupSection
            group={null}
            entries={entries}
            accentColor={accentColor}
            onReorderEntries={(ids) => reorderEntries('free', ids)}
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
      <EntryInput panel="free" />
    </>
  );
}
