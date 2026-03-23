import { createContext, type ReactNode, useContext } from 'react';

import { useImageDrop } from '@/hooks/useImageDrop';
import type { PanelId } from '@/types/memo';
import { DropOverlay } from '@/components/common/dropOverlay';

/** パネル内から画像ファイルピッカーを開くためのコンテキスト */
const ImagePickerContext = createContext<(() => void) | null>(null);
export const useImagePicker = () => useContext(ImagePickerContext);

interface PanelProps {
  panelId: PanelId;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PANEL_ACCENT: Record<PanelId, string> = {
  free:     'var(--panel-free-accent)',
  personal: 'var(--panel-personal-accent)',
  timeline: 'var(--panel-timeline-accent)',
};

export function Panel({ panelId, title, actions, children }: PanelProps) {
  const accent = PANEL_ACCENT[panelId];
  const { isDragOver, fileInputRef, handleFileChange, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFilePicker } = useImageDrop(panelId);

  return (
    <div
      className="flex flex-col h-full bg-bg-panel overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* パネルヘッダー */}
      <div
        className="flex items-center justify-between gap-2 px-3 border-b border-border-subtle bg-bg-surface select-none"
        style={{ height: 'var(--panel-header-h)', minHeight: 'var(--panel-header-h)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="shrink-0"
            style={{ width: 3, height: 14, borderRadius: 'var(--radius-sm)', background: accent }}
          />
          <span className="text-sm font-medium text-text-secondary tracking-wide">
            {title}
          </span>
        </div>
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <ImagePickerContext.Provider value={openFilePicker}>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </ImagePickerContext.Provider>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* ドロップオーバーレイ */}
      {isDragOver && <DropOverlay />}
    </div>
  );
}
