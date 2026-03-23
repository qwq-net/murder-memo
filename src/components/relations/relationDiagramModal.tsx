import { useCallback, useMemo, useState } from 'react';

import { useResponsive } from '@/hooks/useResponsive';
import { useStore } from '@/store';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';
import { RelationDiagramSvg } from '@/components/relations/relationDiagramSvg';
import { RelationListView } from '@/components/relations/relationListView';

export function RelationDiagramModal() {
  const isOpen = useStore((s) => s.isRelationDiagramOpen);
  const setOpen = useStore((s) => s.setRelationDiagramOpen);
  const characters = useStore((s) => s.characters);
  const { isMobile } = useResponsive(1024);
  const [tab, setTab] = useState<'list' | 'diagram'>('list');

  const hasChars = characters.length >= 2;

  return (
    <ModalFrame
      open={isOpen}
      onClose={() => setOpen(false)}
      width={560}
      ariaLabel="相関図"
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            相関図
          </span>
          {/* タブ切替（デスクトップのみ） */}
          {!isMobile && hasChars && (
            <div style={{ display: 'flex', gap: 4 }}>
              {(['list', 'diagram'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: tab === t ? 'var(--bg-active)' : 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 12,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    transition: 'color 0.12s, background 0.12s',
                  }}
                >
                  {t === 'list' ? 'リスト' : '図'}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="modal-close-btn">
          <X size={18} />
        </button>
      </div>

      {/* ボディ */}
      <div style={{ padding: '4px 18px 18px' }}>
        {!hasChars ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            登場人物を2人以上設定してください
          </div>
        ) : tab === 'list' || isMobile ? (
          <RelationListView />
        ) : (
          <RelationDiagramSvg />
        )}
      </div>
    </ModalFrame>
  );
}
