import type { ReactNode } from 'react';

import { X } from '@/components/icons';

// モーダル共通のヘッダースタイル（毎レンダー再生成を避けるためモジュールスコープに固定）
const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px 10px',
  borderBottom: '1px solid var(--border-subtle)',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '0.04em',
};

/**
 * モーダル共通ヘッダー（タイトル + 右端の閉じるボタン）。
 * 複数のモーダルで同一 JSX が手書き反復されていたものを集約。
 */
export function ModalHeader({ title, onClose }: { title: ReactNode; onClose: () => void }) {
  return (
    <div style={HEADER_STYLE}>
      <span style={TITLE_STYLE}>{title}</span>
      <button onClick={onClose} className="modal-close-btn" aria-label="閉じる">
        <X size={18} />
      </button>
    </div>
  );
}
