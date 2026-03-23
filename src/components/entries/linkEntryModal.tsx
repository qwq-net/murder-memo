import { useCallback, useMemo, useState } from 'react';

import { useStore } from '@/store';
import type { MemoEntry, PanelId } from '@/types/memo';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';

const PANEL_LABELS: Record<PanelId, string> = {
  free: 'フリーメモ',
  personal: '自分用メモ',
  timeline: 'タイムライン',
};

interface LinkEntryModalProps {
  entry: MemoEntry;
  open: boolean;
  onClose: () => void;
}

export function LinkEntryModal({ entry, open, onClose }: LinkEntryModalProps) {
  const entries = useStore((s) => s.entries);
  const updateEntry = useStore((s) => s.updateEntry);
  const [query, setQuery] = useState('');

  const linkedIds = useMemo(() => new Set(entry.linkedEntryIds ?? []), [entry.linkedEntryIds]);

  // 自分自身を除外し、検索フィルタを適用
  const candidates = useMemo(() => {
    const others = entries.filter((e) => e.id !== entry.id);
    if (!query.trim()) return others;
    const q = query.trim().toLowerCase();
    return others.filter((e) => e.content.toLowerCase().includes(q));
  }, [entries, entry.id, query]);

  // パネル別にグループ化
  const grouped = useMemo(() => {
    const map = new Map<PanelId, MemoEntry[]>();
    for (const e of candidates) {
      const list = map.get(e.panel) ?? [];
      list.push(e);
      map.set(e.panel, list);
    }
    return map;
  }, [candidates]);

  const toggleLink = useCallback(async (targetId: string) => {
    const current = entry.linkedEntryIds ?? [];
    const next = current.includes(targetId)
      ? current.filter((id) => id !== targetId)
      : [...current, targetId];
    await updateEntry(entry.id, { linkedEntryIds: next.length > 0 ? next : undefined });
  }, [entry.id, entry.linkedEntryIds, updateEntry]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  /** エントリのプレビュー文字列（最大40文字） */
  const preview = (e: MemoEntry) => {
    if (e.type === 'image') return e.content ? `[画像] ${e.content}` : '[画像]';
    const text = e.content || '（空）';
    return text.length > 40 ? text.slice(0, 40) + '…' : text;
  };

  return (
    <ModalFrame open={open} onClose={handleClose} width={440} ariaLabel="リンク設定">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
          リンク設定
        </span>
        <button onClick={handleClose} className="modal-close-btn">
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '8px 18px 18px' }}>
        {/* 検索 */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="エントリを検索…"
          className="input-base"
          style={{ width: '100%', marginBottom: 8 }}
        />

        {/* リンク済み表示 */}
        {linkedIds.size > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '4px 0' }}>
              リンク中（{linkedIds.size}件）
            </div>
            {entries.filter((e) => linkedIds.has(e.id)).map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview(e)}
                </span>
                <button
                  onClick={() => toggleLink(e.id)}
                  title="リンク解除"
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 候補リスト */}
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {(['free', 'timeline', 'personal'] as PanelId[]).map((panel) => {
            const list = grouped.get(panel);
            if (!list || list.length === 0) return null;
            return (
              <div key={panel}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '6px 0 2px' }}>
                  {PANEL_LABELS[panel]}
                </div>
                {list.map((e) => {
                  const isLinked = linkedIds.has(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleLink(e.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        textAlign: 'left',
                        padding: '5px 4px',
                        background: isLinked ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: 'var(--radius-sm)',
                        border: isLinked ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                        background: isLinked ? 'var(--accent)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#fff',
                        fontSize: 11,
                      }}>
                        {isLinked && '✓'}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview(e)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </ModalFrame>
  );
}
