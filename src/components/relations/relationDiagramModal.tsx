import { useState } from 'react';

import { ModalEmptyMessage } from '@/components/common/modalEmptyMessage';
import { ModalFrame } from '@/components/common/modalFrame';
import { X } from '@/components/icons';
import { RelationDiagramSvg } from '@/components/relations/relationDiagramSvg';
import { RelationListView } from '@/components/relations/relationListView';
import { useT } from '@/i18n';
import { useResponsive } from '@/hooks/useResponsive';
import { useStore } from '@/store';

export function RelationDiagramModal() {
  const t = useT();
  const isOpen = useStore((s) => s.isRelationDiagramOpen);
  const setOpen = useStore((s) => s.setRelationDiagramOpen);
  const characters = useStore((s) => s.characters);
  const { isMobile } = useResponsive(1024);
  const [tab, setTab] = useState<'list' | 'diagram'>('list');

  const hasChars = characters.length >= 2;

  return (
    <ModalFrame open={isOpen} onClose={() => setOpen(false)} width={560} ariaLabel={t('relations.title')}>
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
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            {t('relations.title')}
          </span>
          {/* タブ切替（デスクトップのみ） */}
          {!isMobile && hasChars && (
            <div style={{ display: 'flex', gap: 4 }}>
              {(['list', 'diagram'] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  style={{
                    background: tab === tabKey ? 'var(--bg-active)' : 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: tab === tabKey ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 12,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    transition: 'color 0.12s, background 0.12s',
                  }}
                >
                  {tabKey === 'list' ? t('relations.tabList') : t('relations.tabDiagram')}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="modal-close-btn" aria-label={t('common.close')}>
          <X size={18} />
        </button>
      </div>

      {/* ボディ */}
      <div style={{ padding: '4px 18px 18px' }}>
        {!hasChars ? (
          <ModalEmptyMessage>{t('relations.needMoreChars')}</ModalEmptyMessage>
        ) : tab === 'list' || isMobile ? (
          <RelationListView />
        ) : (
          <RelationDiagramSvg />
        )}
      </div>
    </ModalFrame>
  );
}
