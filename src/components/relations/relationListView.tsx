import { useCallback, useMemo, useRef, useState } from 'react';

import { useStore } from '@/store';
import { X } from '@/components/icons';

/** ラベルプリセット — 各テンプレにデフォルト色を定義 */
const LABEL_PRESETS: { label: string; color: string }[] = [
  { label: '友人', color: '#3498db' },
  { label: '恋人', color: '#e91e8c' },
  { label: '家族', color: '#2ecc71' },
  { label: '上司部下', color: '#8e44ad' },
  { label: '敵対', color: '#e74c3c' },
  { label: '協力者', color: '#27ae60' },
  { label: '知人', color: '#95a5a6' },
  { label: '不明', color: '#7f8c8d' },
];

/** プリセットからラベル名でデフォルト色を取得 */
function getPresetColor(label: string): string | undefined {
  return LABEL_PRESETS.find((p) => p.label === label)?.color;
}

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
  const [color, setColor] = useState('#95a5a6');
  const colorInputRef = useRef<HTMLInputElement>(null);

  const canAdd = fromId && toId && fromId !== toId && label.trim();

  const handlePresetClick = useCallback((preset: { label: string; color: string }) => {
    setLabel(preset.label);
    setColor(preset.color);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!canAdd) return;
    await addRelation({
      fromCharacterId: fromId,
      toCharacterId: toId,
      label: label.trim(),
      color,
    });
    setFromId('');
    setToId('');
    setLabel('');
    setColor('#95a5a6');
    addToast('関係を追加しました');
  }, [canAdd, fromId, toId, label, color, addRelation, addToast]);

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
              <span
                style={{
                  fontSize: 12,
                  color: r.color || 'var(--text-muted)',
                  padding: '1px 6px',
                  background: 'var(--bg-active)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${r.color || 'var(--border-strong)'}`,
                }}
              >
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

        {/* ラベル入力 + カラーピッカー */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              // プリセットに一致する場合はデフォルト色を適用
              const preset = getPresetColor(e.target.value);
              if (preset) setColor(preset);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && canAdd) {
                handleAdd();
              }
            }}
            placeholder="関係（例: 友人）"
            className="input-base"
            style={{ flex: 1 }}
          />
          {/* カラーピッカー */}
          <button
            onClick={() => colorInputRef.current?.click()}
            title="線の色を選択"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              background: color,
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          />
          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
        </div>

        {/* プリセットチップ */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LABEL_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePresetClick(p)}
              style={{
                background: label === p.label ? 'var(--bg-active)' : 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${p.color}`,
                color: label === p.label ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                padding: '2px 8px',
                cursor: 'pointer',
                transition: 'color 0.12s, background 0.12s',
              }}
            >
              {p.label}
            </button>
          ))}
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
