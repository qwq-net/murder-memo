import { type ReactNode } from 'react';

import { DropOverlay } from '@/components/common/dropOverlay';
import { ImagePickerContext } from '@/components/layout/imagePickerContext';
import { useImageDrop } from '@/hooks/useImageDrop';
import type { PanelId } from '@/types/memo';

interface PanelProps {
  panelId: PanelId;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PANEL_ACCENT: Record<PanelId, string> = {
  free: 'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export function Panel({ panelId, title, actions, children }: PanelProps) {
  const accent = PANEL_ACCENT[panelId];
  const {
    isDragOver,
    fileInputRef,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFilePicker,
  } = useImageDrop(panelId);

  return (
    <div
      className="bg-bg-panel relative flex h-full flex-col overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* パネルヘッダー */}
      <div
        className="border-border-subtle bg-bg-surface flex items-center justify-between gap-2 border-b px-3 select-none"
        style={{ height: 'var(--panel-header-h)', minHeight: 'var(--panel-header-h)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="shrink-0"
            style={{ width: 3, height: 14, borderRadius: 'var(--radius-sm)', background: accent }}
          />
          <span className="text-text-secondary text-sm font-medium tracking-wide">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>

      {/* コンテンツ */}
      <ImagePickerContext.Provider value={openFilePicker}>
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </ImagePickerContext.Provider>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* ドロップオーバーレイ */}
      {isDragOver && <DropOverlay />}
    </div>
  );
}
