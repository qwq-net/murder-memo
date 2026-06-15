import { useCallback, useMemo, useRef, useState } from 'react';

import { useT } from '@/i18n';
import {
  getRelationPresetColor,
  resolveRelationLabelPresets,
} from '@/components/relations/relationLabelPresets';
import { RelationListItemView } from '@/components/relations/relationListItemView';
import { useStore } from '@/store';

export function RelationListView() {
  const t = useT();
  const characters = useStore((s) => s.characters);
  const relations = useStore((s) => s.relations);
  const addRelation = useStore((s) => s.addRelation);
  const removeRelation = useStore((s) => s.removeRelation);
  const addToast = useStore((s) => s.addToast);

  const charMap = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  // 現在の言語で解決したプリセット一覧（t の変化に追従）
  const presets = useMemo(() => resolveRelationLabelPresets(t), [t]);

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
    addToast(t('relations.toastAdded'));
  }, [canAdd, fromId, toId, label, color, addRelation, addToast, t]);

  const handleRemove = useCallback(
    async (id: string) => {
      await removeRelation(id);
      addToast(t('relations.toastRemoved'));
    },
    [removeRelation, addToast, t],
  );

  const charName = (id: string) => charMap.get(id)?.name ?? '？';
  const charColor = (id: string) => charMap.get(id)?.color ?? 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 既存の関係リスト */}
      {relations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {relations.map((r) => (
            <RelationListItemView
              key={r.id}
              relation={r}
              fromName={charName(r.fromCharacterId)}
              fromColor={charColor(r.fromCharacterId)}
              toName={charName(r.toCharacterId)}
              toColor={charColor(r.toCharacterId)}
              onRemove={handleRemove}
              removeTitle={t('relations.removeRelationTitle')}
            />
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
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          {t('relations.addHeading')}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="input-base"
            style={{ flex: 1, minWidth: 80 }}
          >
            <option value="">{t('relations.person1Placeholder')}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="input-base"
            style={{ flex: 1, minWidth: 80 }}
          >
            <option value="">{t('relations.person2Placeholder')}</option>
            {characters
              .filter((c) => c.id !== fromId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
              const preset = getRelationPresetColor(e.target.value, presets);
              if (preset) setColor(preset);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && canAdd) {
                handleAdd();
              }
            }}
            placeholder={t('relations.labelPlaceholder')}
            className="input-base"
            style={{ flex: 1 }}
          />
          {/* カラーピッカー */}
          <button
            onClick={() => colorInputRef.current?.click()}
            title={t('relations.colorPickerTitle')}
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
          {presets.map((p) => (
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
          {t('common.add')}
        </button>
      </div>
    </div>
  );
}
