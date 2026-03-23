import { useCallback, useMemo, useState } from 'react';

import { useStore } from '@/store';
import type { Character } from '@/types/memo';
import { X } from '@/components/icons';

const LABEL_SUGGESTIONS = ['友人', '恋人', '家族', '上司部下', '敵対', '協力者', '知人', '不明'];

export function RelationListView() {
  const characters = useStore((s) => s.characters);
  const relations = useStore((s) => s.relations);
  const addRelation = useStore((s) => s.addRelation);
  const removeRelation = useStore((s) => s.removeRelation);
  const addToast = useStore((s) => s.addToast);

  const charMap = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );

  // ── 追加フォーム ──
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [label, setLabel] = useState('');

  const canAdd = fromId && toId && fromId !== toId && label.trim();

  const handleAdd = useCallback(async () => {
    if (!canAdd) return;
    await addRelation({
      fromCharacterId: fromId,
      toCharacterId: toId,
      label: label.trim(),
    });
    setFromId('');
    setToId('');
    setLabel('');
    addToast('関係を追加しました');
  }, [canAdd, fromId, toId, label, addRelation, addToast]);

  const handleRemove = useCallback(async (id: string) => {
    await removeRelation(id);
    addToast('関係を削除しました');
  }, [removeRelation, addToast]);

  const charName = (id: string) => charMap.get(id)?.name ?? '？';
  const charColor = (id: string) => charMap.get(id)?.color ?? 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 既存の関係リスト */}
      {relations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {relations.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: charColor(r.fromCharacterId), flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{charName(r.fromCharacterId)}</span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '1px 6px', background: 'var(--bg-active)', borderRadius: 'var(--radius-sm)' }}>
                {r.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: charColor(r.toCharacterId), flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{charName(r.toCharacterId)}</span>
              </span>
              <button
                onClick={() => handleRemove(r.id)}
                title="関係を削除"
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '10px 0 0',
          borderTop: relations.length > 0 ? '1px solid var(--border-subtle)' : undefined,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          関係を追加
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="input-base"
            style={{ flex: 1, minWidth: 80 }}
          >
            <option value="">人物1</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="input-base"
            style={{ flex: 1, minWidth: 80 }}
          >
            <option value="">人物2</option>
            {characters.filter((c) => c.id !== fromId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ラベル入力 + プリセットチップ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && canAdd) {
                handleAdd();
              }
            }}
            placeholder="関係（例: 友人）"
            className="input-base"
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {LABEL_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setLabel(s)}
                style={{
                  background: label === s ? 'var(--bg-active)' : 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: label === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 12,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  transition: 'color 0.12s, background 0.12s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="btn-primary btn-sm"
          style={{ alignSelf: 'flex-start' }}
        >
          追加
        </button>
      </div>
    </div>
  );
}
