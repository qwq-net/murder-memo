import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ImageLightboxProps {
  src: string;
  open: boolean;
  onClose: () => void;
}

/**
 * 画像をフルサイズ表示するライトボックス。
 * オーバーレイクリックまたは ESC で閉じる。
 */
export function ImageLightbox({ src, open, onClose }: ImageLightboxProps) {
  useEscapeKey(onClose, open);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 'var(--radius-md)',
          cursor: 'default',
        }}
      />
    </div>
  );
}
